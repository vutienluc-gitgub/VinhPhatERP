/**
 * VinhPhat MCP Server
 * Chạy qua stdio — được spawn bởi agent.ts làm subprocess.
 * Expose các Supabase tool cho Claude sử dụng.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// ---------- Supabase client ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  process.stderr.write(
    '[mcp-server] SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY chưa cấu hình\n',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------- MCP Server ----------
const server = new Server(
  {
    name: 'vinhphat-mcp',
    version: '1.0.0',
  },
  { capabilities: { tools: {} } },
);

// ---- Khai báo Tools ----
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_orders',
      description:
        'Lấy danh sách đơn hàng. Có thể lọc theo trạng thái, khoảng thời gian. Trả về mã đơn, khách hàng, ngày, tổng tiền, trạng thái.',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: [
              'draft',
              'confirmed',
              'in_progress',
              'completed',
              'cancelled',
            ],
            description: 'Lọc theo trạng thái đơn hàng',
          },
          from_date: {
            type: 'string',
            description: 'Ngày bắt đầu (YYYY-MM-DD)',
          },
          to_date: {
            type: 'string',
            description: 'Ngày kết thúc (YYYY-MM-DD)',
          },
          limit: {
            type: 'number',
            description: 'Số lượng tối đa (mặc định 20)',
          },
        },
      },
    },
    {
      name: 'get_order',
      description:
        'Lấy chi tiết đầy đủ một đơn hàng: các mục hàng, số tiền đã trả, trạng thái giao hàng.',
      inputSchema: {
        type: 'object',
        required: ['order_number'],
        properties: {
          order_number: {
            type: 'string',
            description: 'Mã số đơn hàng (VD: DH-2025-001)',
          },
        },
      },
    },
    {
      name: 'list_customers',
      description:
        'Lấy danh sách khách hàng. Có thể tìm theo tên hoặc lọc theo trạng thái.',
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Tìm theo tên hoặc mã khách hàng',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
          },
          limit: {
            type: 'number',
            description: 'Số lượng tối đa (mặc định 20)',
          },
        },
      },
    },
    {
      name: 'list_suppliers',
      description: 'Lấy danh sách nhà cung cấp nguyên liệu (sợi, vải).',
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Tìm theo tên hoặc mã nhà cung cấp',
          },
          limit: {
            type: 'number',
            description: 'Số lượng tối đa (mặc định 20)',
          },
        },
      },
    },
    {
      name: 'list_yarn_receipts',
      description:
        'Lấy danh sách phiếu nhập sợi. Có thể lọc theo nhà cung cấp, trạng thái, khoảng thời gian.',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'confirmed', 'cancelled'],
          },
          from_date: {
            type: 'string',
            description: 'YYYY-MM-DD',
          },
          to_date: {
            type: 'string',
            description: 'YYYY-MM-DD',
          },
          limit: { type: 'number' },
        },
      },
    },
    {
      name: 'get_business_summary',
      description:
        'Tổng hợp kinh doanh: tổng đơn hàng, doanh thu, số khách hàng, tình trạng công nợ theo khoảng thời gian.',
      inputSchema: {
        type: 'object',
        properties: {
          from_date: {
            type: 'string',
            description: 'YYYY-MM-DD',
          },
          to_date: {
            type: 'string',
            description: 'YYYY-MM-DD',
          },
        },
      },
    },
  ],
}));

// ---- Xử lý Tool Calls ----
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // --------------------------------------------------
      case 'list_orders': {
        let query = supabase
          .from('orders')
          .select(
            `
            id, order_number, status, order_date, delivery_date,
            total_amount, paid_amount, notes,
            customers ( code, name, phone )
          `,
          )
          .order('created_at', { ascending: false })
          .limit((args?.limit as number) ?? 20);

        if (args?.status) query = query.eq('status', args.status as string);
        if (args?.from_date)
          query = query.gte('order_date', args.from_date as string);
        if (args?.to_date)
          query = query.lte('order_date', args.to_date as string);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      // --------------------------------------------------
      case 'get_order': {
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .select(
            `
            id, order_number, status, order_date, delivery_date,
            total_amount, paid_amount, notes, confirmed_at,
            customers ( code, name, phone, email, address ),
            order_items ( fabric_type, color_name, color_code, quantity, unit, unit_price, notes ),
            payments ( amount, payment_date, payment_method, notes ),
            shipments ( shipment_date, status, quantity_sent, notes )
          `,
          )
          .eq('order_number', (args?.order_number as string) ?? '')
          .single();

        if (orderErr) throw new Error(orderErr.message);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(order, null, 2),
            },
          ],
        };
      }

      // --------------------------------------------------
      case 'list_customers': {
        let query = supabase
          .from('customers')
          .select(
            'id, code, name, phone, email, address, status, source, created_at',
          )
          .order('name')
          .limit((args?.limit as number) ?? 20);

        if (args?.status) query = query.eq('status', args.status as string);
        if (args?.search) {
          query = query.or(
            `name.ilike.%${args.search}%,code.ilike.%${args.search}%`,
          );
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      // --------------------------------------------------
      case 'list_suppliers': {
        let query = supabase
          .from('suppliers')
          .select('id, code, name, phone, email, address, status, created_at')
          .order('name')
          .limit((args?.limit as number) ?? 20);

        if (args?.search) {
          query = query.or(
            `name.ilike.%${args.search}%,code.ilike.%${args.search}%`,
          );
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      // --------------------------------------------------
      case 'list_yarn_receipts': {
        let query = supabase
          .from('yarn_receipts')
          .select(
            `
            id, receipt_number, receipt_date, total_amount, status, notes,
            suppliers ( code, name ),
            yarn_receipt_items ( yarn_type, color_name, quantity, unit, unit_price )
          `,
          )
          .order('created_at', { ascending: false })
          .limit((args?.limit as number) ?? 20);

        if (args?.status) query = query.eq('status', args.status as string);
        if (args?.from_date)
          query = query.gte('receipt_date', args.from_date as string);
        if (args?.to_date)
          query = query.lte('receipt_date', args.to_date as string);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      // --------------------------------------------------
      case 'get_business_summary': {
        const fromDate =
          (args?.from_date as string) ??
          new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .slice(0, 10);
        const toDate =
          (args?.to_date as string) ?? new Date().toISOString().slice(0, 10);

        const [ordersRes, customersRes] = await Promise.all([
          supabase
            .from('orders')
            .select('status, total_amount, paid_amount')
            .gte('order_date', fromDate)
            .lte('order_date', toDate),
          supabase
            .from('customers')
            .select('id, status')
            .eq('status', 'active'),
        ]);

        if (ordersRes.error) throw new Error(ordersRes.error.message);
        if (customersRes.error) throw new Error(customersRes.error.message);

        const orders = ordersRes.data ?? [];
        const totalRevenue = orders.reduce(
          (s, o) => s + parseFloat(o.total_amount ?? '0'),
          0,
        );
        const totalPaid = orders.reduce(
          (s, o) => s + parseFloat(o.paid_amount ?? '0'),
          0,
        );
        const debt = totalRevenue - totalPaid;

        const statusCount = orders.reduce<Record<string, number>>((acc, o) => {
          acc[o.status] = (acc[o.status] ?? 0) + 1;
          return acc;
        }, {});

        const summary = {
          period: {
            from: fromDate,
            to: toDate,
          },
          orders: {
            total: orders.length,
            by_status: statusCount,
          },
          revenue: {
            total: totalRevenue.toFixed(2),
            paid: totalPaid.toFixed(2),
            debt: debt.toFixed(2),
          },
          active_customers: customersRes.data?.length ?? 0,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      // --------------------------------------------------
      default:
        throw new Error(`Tool không tồn tại: ${name}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Lỗi: ${message}`,
        },
      ],
    };
  }
});

// ---------- Start ----------
const transport = new StdioServerTransport();
await server.connect(transport);
