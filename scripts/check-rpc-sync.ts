/**
 * check-rpc-sync.ts
 * So sánh rpc() calls trong code với functions thực tế trong DB.
 * Phát hiện: MISSING, PARAM_MISMATCH, TYPE_MISMATCH.
 */

import { RpcCall } from './parse-rpc-calls';
import { DbFunction, normalizeType } from './query-db-functions';

// ──────────────────────────────────────────────
// Issue types
// ──────────────────────────────────────────────
export type MissingIssue = {
  kind: 'MISSING';
  fnName: string;
  // Function ada di code tapi tidak ada di DB
};

export type ParamMismatchIssue = {
  kind: 'PARAM_MISMATCH';
  fnName: string;
  extraInCode: string[];   // param có trong code nhưng không có trong DB
  extraInDb: string[];     // param có trong DB nhưng không có trong code
};

export type TypeMismatchIssue = {
  kind: 'TYPE_MISMATCH';
  fnName: string;
  mismatches: Array<{
    param: string;
    codeType: string;
    dbType: string;
  }>;
};

export type SyncIssue = MissingIssue | ParamMismatchIssue | TypeMismatchIssue;

// ──────────────────────────────────────────────
// Main comparison
// ──────────────────────────────────────────────
export function compareRpc(
  codeCalls: RpcCall[],
  dbFunctions: DbFunction[]
): SyncIssue[] {
  const dbMap = new Map(dbFunctions.map((f) => [f.name, f]));
  const issues: SyncIssue[] = [];

  for (const call of codeCalls) {
    const dbFn = dbMap.get(call.fnName);

    // 1. Function không tồn tại trong DB
    if (!dbFn) {
      issues.push({ kind: 'MISSING', fnName: call.fnName });
      continue;
    }

    const codeParamNames = new Set(call.params.map((p) => p.name));
    const dbParamNames = new Set(dbFn.params.map((p) => p.name));

    // 2. Param name mismatch
    const extraInCode = [...codeParamNames].filter((n) => !dbParamNames.has(n));
    const extraInDb = [...dbParamNames].filter((n) => !codeParamNames.has(n));

    if (extraInCode.length > 0 || extraInDb.length > 0) {
      issues.push({
        kind: 'PARAM_MISMATCH',
        fnName: call.fnName,
        extraInCode,
        extraInDb,
      });
      continue; // type check không có nghĩa nếu tên đã lệch
    }

    // 3. Type mismatch (chỉ check params có trong cả hai)
    const typeMismatches: TypeMismatchIssue['mismatches'] = [];

    for (const codeParam of call.params) {
      const dbParam = dbFn.params.find((p) => p.name === codeParam.name);
      if (!dbParam) continue;

      const normalizedDbType = normalizeType(dbParam.type);
      if (normalizedDbType !== codeParam.type) {
        typeMismatches.push({
          param: codeParam.name,
          codeType: codeParam.type,
          dbType: normalizedDbType,
        });
      }
    }

    if (typeMismatches.length > 0) {
      issues.push({
        kind: 'TYPE_MISMATCH',
        fnName: call.fnName,
        mismatches: typeMismatches,
      });
    }
  }

  return issues;
}

// ──────────────────────────────────────────────
// Formatter — in ra terminal đẹp
// ──────────────────────────────────────────────
export function formatIssues(issues: SyncIssue[], calls: RpcCall[]): string {
  const lines: string[] = [];
  lines.push(`❌ Found ${issues.length} issue(s):\n`);

  for (const issue of issues) {
    const call = calls.find((c) => c.fnName === issue.fnName);
    const location = call ? `  📄 ${call.sourceFile}:${call.line}` : '';

    switch (issue.kind) {
      case 'MISSING':
        lines.push(`┌─ MISSING  public.${issue.fnName}()`);
        lines.push(`│  Function exists in code but NOT in database.`);
        if (location) lines.push(`│  ${location}`);
        lines.push(`└─ Fix: run with --fix to generate migration\n`);
        break;

      case 'PARAM_MISMATCH':
        lines.push(`┌─ PARAM_MISMATCH  public.${issue.fnName}()`);
        if (issue.extraInCode.length > 0)
          lines.push(`│  In code but not DB:  ${issue.extraInCode.map((p) => `"${p}"`).join(', ')}`);
        if (issue.extraInDb.length > 0)
          lines.push(`│  In DB but not code:  ${issue.extraInDb.map((p) => `"${p}"`).join(', ')}`);
        if (location) lines.push(`│  ${location}`);
        lines.push(`└─ Fix: run with --fix to regenerate migration\n`);
        break;

      case 'TYPE_MISMATCH':
        lines.push(`┌─ TYPE_MISMATCH  public.${issue.fnName}()`);
        for (const m of issue.mismatches) {
          lines.push(`│  ${m.param}: code expects "${m.codeType}", DB has "${m.dbType}"`);
        }
        if (location) lines.push(`│  ${location}`);
        lines.push(`└─ Fix: update SQL function types manually\n`);
        break;
    }
  }

  return lines.join('\n');
}
