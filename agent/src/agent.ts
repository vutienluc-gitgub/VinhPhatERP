/**
 * VinhPhat AI Agent
 * CLI chat tương tác — dùng Claude + MCP Server (Supabase tools).
 *
 * Khởi động: npm run agent  (từ thư mục agent/)
 */
import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// ---- Kiểm tra env ----
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  console.error('[agent] ANTHROPIC_API_KEY chưa cấu hình trong .env')
  process.exit(1)
}

// ---- Khởi động MCP Client (spawn mcp-server.ts làm subprocess) ----
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const transport = new StdioClientTransport({
  command: 'tsx',
  args: [path.join(__dirname, 'mcp-server.ts')],
  env: {
    ...process.env,
    SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
})

const mcpClient = new Client(
  { name: 'vinhphat-agent', version: '1.0.0' },
  { capabilities: {} },
)

console.log('Đang kết nối MCP Server...')
await mcpClient.connect(transport)

// ---- Lấy tools từ MCP và chuyển sang format Anthropic ----
const { tools: mcpTools } = await mcpClient.listTools()

const anthropicTools: Anthropic.Tool[] = mcpTools.map((t) => ({
  name: t.name,
  description: t.description ?? '',
  input_schema: t.inputSchema as Anthropic.Tool['input_schema'],
}))

console.log(`Đã tải ${anthropicTools.length} tools: ${anthropicTools.map((t) => t.name).join(', ')}`)

// ---- Anthropic client ----
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là Trợ lý AI nội bộ của công ty Vịnh Phát — chuyên sản xuất vải dệt kim.
Bạn giúp nhân viên tra cứu đơn hàng, khách hàng, nhà cung cấp, nguyên liệu và tổng hợp kinh doanh.

Nguyên tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.
- Khi cần dữ liệu, hãy dùng tools để truy vấn Supabase thay vì đoán.
- Trình bày số tiền theo định dạng VNĐ có dấu phẩy nghìn (VD: 1.250.000 đ).
- Khi liệt kê, dùng bảng hoặc danh sách có thứ tự.
- Ngày tháng định dạng theo kiểu Việt Nam: DD/MM/YYYY.`

// ---- Vòng lặp chat ----
type Message = Anthropic.MessageParam

const messages: Message[] = []

async function chat(userInput: string): Promise<string> {
  messages.push({ role: 'user', content: userInput })

  // Agentic loop: tiếp tục cho đến khi Claude không còn gọi tool
  for (;;) {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: anthropicTools,
      messages,
    })

    // Lưu response vào lịch sử
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      return textBlock?.text ?? '(không có phản hồi)'
    }

    if (response.stop_reason !== 'tool_use') {
      break
    }

    // Xử lý các tool_use blocks
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (toolUse) => {
        process.stdout.write(`  → Gọi tool: ${toolUse.name}...\n`)

        const result = await mcpClient.callTool({
          name: toolUse.name,
          arguments: toolUse.input as Record<string, unknown>,
        })

        return {
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: result.content as string,
          is_error: result.isError === true,
        }
      }),
    )

    messages.push({ role: 'user', content: toolResults })
  }

  return '(lỗi không xác định)'
}

// ---- CLI ----
const rl = readline.createInterface({ input: stdin, output: stdout })

console.log('\n╔══════════════════════════════════════╗')
console.log('║   Vịnh Phát AI Agent  (gõ /exit)    ║')
console.log('╚══════════════════════════════════════╝\n')

for (;;) {
  const input = await rl.question('Bạn: ')

  const trimmed = input.trim()
  if (!trimmed) continue
  if (trimmed === '/exit' || trimmed === '/quit') {
    console.log('Tạm biệt!')
    break
  }

  if (trimmed === '/clear') {
    messages.length = 0
    console.log('Đã xóa lịch sử hội thoại.\n')
    continue
  }

  try {
    const reply = await chat(trimmed)
    console.log(`\nAgent: ${reply}\n`)
  } catch (err) {
    console.error('Lỗi:', err instanceof Error ? err.message : err)
  }
}

await mcpClient.close()
rl.close()
