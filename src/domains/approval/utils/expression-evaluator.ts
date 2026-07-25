/* eslint-disable @typescript-eslint/no-explicit-any */
export type ConditionOperator =
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'contains'
  | 'in';

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  rules: (ConditionRule | ConditionGroup)[];
}

export type ApprovalCondition = ConditionGroup | ConditionRule;

export class ExpressionEvaluator {
  /**
   * Đánh giá một tập hợp điều kiện JSONB với dữ liệu document thực tế.
   * Nếu condition trống, mặc định trả về true (luôn thỏa mãn).
   */
  static evaluate(
    condition: ApprovalCondition | null | undefined,
    document: Record<string, unknown>,
  ): boolean {
    if (!condition || Object.keys(condition).length === 0) return true;

    if ('logic' in condition) {
      // ConditionGroup
      if (condition.logic === 'AND') {
        return condition.rules.every((rule) => this.evaluate(rule, document));
      } else if (condition.logic === 'OR') {
        return condition.rules.some((rule) => this.evaluate(rule, document));
      }
      return false;
    } else if ('field' in condition) {
      // ConditionRule
      return this.evaluateRule(condition as ConditionRule, document);
    }

    return true; // Malformed condition is ignored
  }

  private static evaluateRule(
    rule: ConditionRule,
    document: Record<string, unknown>,
  ): boolean {
    const docValue = this.getFieldValue(rule.field, document);
    const { operator, value } = rule;

    if (docValue === undefined && value !== undefined && operator !== '!=') {
      return false; // Cannot evaluate missing field against a required value
    }

    switch (operator) {
      case '==':
        return (docValue as any) == (value as any);
      case '!=':
        return (docValue as any) != (value as any);
      case '>':
        return (docValue as any) > (value as any);
      case '<':
        return (docValue as any) < (value as any);
      case '>=':
        return (docValue as any) >= (value as any);
      case '<=':
        return (docValue as any) <= (value as any);
      case 'contains':
        if (typeof docValue === 'string' && typeof value === 'string') {
          return docValue.toLowerCase().includes(value.toLowerCase());
        }
        if (Array.isArray(docValue)) {
          return docValue.includes(value);
        }
        return false;
      case 'in':
        if (Array.isArray(value)) {
          return value.includes(docValue);
        }
        return false;
      default:
        return false;
    }
  }

  private static getFieldValue(
    fieldPath: string,
    obj: Record<string, unknown>,
  ): unknown {
    const parts = fieldPath.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}
