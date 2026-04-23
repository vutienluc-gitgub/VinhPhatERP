/**
 * parse-rpc-calls.ts
 * Dùng ts-morph để parse TypeScript AST và tìm tất cả supabase.rpc(...) calls.
 * Chính xác hơn regex vì xử lý được multiline, optional chaining, alias, v.v.
 */

import path from 'path';

import {
  Project,
  SyntaxKind,
  CallExpression,
  ObjectLiteralExpression,
  Node,
} from 'ts-morph';

export type ParamType =
  | 'uuid'
  | 'text'
  | 'int'
  | 'numeric'
  | 'boolean'
  | 'timestamptz'
  | 'jsonb';

export type RpcParam = {
  name: string;     // tên param, vd: p_id
  type: ParamType;  // SQL type được infer
  optional: boolean;
};

export type RpcCall = {
  fnName: string;
  params: RpcParam[];
  sourceFile: string;
  line: number;
};

// ──────────────────────────────────────────────
// Inference rules: tên field → SQL type
// ──────────────────────────────────────────────
const TYPE_RULES: Array<{ pattern: RegExp; type: ParamType }> = [
  { pattern: /(_id|^id)$/i,              type: 'uuid' },
  { pattern: /(_at|_date|_time)$/i,      type: 'timestamptz' },
  { pattern: /(_count|_qty|_quantity|_order|_index|_position)$/i, type: 'int' },
  { pattern: /(_amount|_price|_cost|_total|_rate|_percent)$/i, type: 'numeric' },
  { pattern: /^(is_|has_|can_|_flag|_enabled|_active)/i, type: 'boolean' },
  { pattern: /(_data|_meta|_config|_payload|_json)$/i,   type: 'jsonb' },
];

function inferSqlType(paramName: string, tsType?: string): ParamType {
  // Nếu có TypeScript type rõ ràng
  if (tsType) {
    if (tsType.includes('boolean')) return 'boolean';
    if (tsType.includes('number'))  return 'numeric';
  }

  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(paramName)) return rule.type;
  }

  return 'text'; // default
}

function isOptionalParam(paramName: string, valueText: string): boolean {
  // Nếu value có ?? '' hoặc ?? null thì là optional
  return valueText.includes("?? ''") || valueText.includes('?? null') || valueText.includes('?? undefined');
}

// ──────────────────────────────────────────────
// Extract params từ object literal: { p_id: id, p_name: name }
// ──────────────────────────────────────────────
function extractParams(objNode: Node): RpcParam[] {
  if (!objNode || !Node.isObjectLiteralExpression(objNode)) return [];

  const obj = objNode as ObjectLiteralExpression;
  const params: RpcParam[] = [];

  for (const prop of obj.getProperties()) {
    if (!Node.isPropertyAssignment(prop) && !Node.isShorthandPropertyAssignment(prop)) continue;

    const name = prop.getName();
    const valueText = Node.isPropertyAssignment(prop)
      ? prop.getInitializer()?.getText() ?? ''
      : name;

    // Lấy TypeScript type của value nếu có
    let tsType: string | undefined;
    try {
      if (Node.isPropertyAssignment(prop)) {
        tsType = prop.getInitializer()?.getType().getText();
      }
    } catch {
      // ignore
    }

    params.push({
      name,
      type: inferSqlType(name, tsType),
      optional: isOptionalParam(name, valueText),
    });
  }

  return params;
}

// ──────────────────────────────────────────────
// Nhận diện đây có phải supabase.rpc() call không
// Hỗ trợ: supabase.rpc(), client.rpc(), supabaseClient.rpc()
// ──────────────────────────────────────────────
function isRpcCall(call: CallExpression): boolean {
  const expr = call.getExpression();
  const text = expr.getText();

  // Chỉ match .rpc ở cuối expression
  return text.endsWith('.rpc');
}

// ──────────────────────────────────────────────
// Main parser
// ──────────────────────────────────────────────
export function parseRpcCalls(srcDir: string): RpcCall[] {
  const absoluteSrcDir = path.resolve(srcDir);

  const project = new Project({
    compilerOptions: {
      allowJs: true,
      noEmit: true,
    },
  });

  // Thêm tất cả .ts và .tsx files, bỏ qua .d.ts và node_modules
  project.addSourceFilesAtPaths([
    `${absoluteSrcDir}/**/*.ts`,
    `${absoluteSrcDir}/**/*.tsx`,
    `!${absoluteSrcDir}/**/*.d.ts`,
    `!${absoluteSrcDir}/**/node_modules/**`,
  ]);

  const calls: RpcCall[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();

    sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .forEach((callExpr) => {
        if (!isRpcCall(callExpr)) return;

        const args = callExpr.getArguments();
        if (args.length < 1) return;

        // Arg 0: tên function (string literal)
        const fnArg = args[0];
        if (!Node.isStringLiteral(fnArg)) return; // bỏ qua dynamic fn names
        const fnName = fnArg.getLiteralText();

        // Arg 1: params object (optional — một số call không truyền params)
        const paramsArg = args[1];
        const params = paramsArg ? extractParams(paramsArg) : [];

        const line = callExpr.getStartLineNumber();

        calls.push({ fnName, params, sourceFile: filePath, line });
      });
  }

  // Deduplicate: cùng fnName từ nhiều file → giữ lại cái đầu
  const seen = new Set<string>();
  return calls.filter((c) => {
    if (seen.has(c.fnName)) return false;
    seen.add(c.fnName);
    return true;
  });
}
