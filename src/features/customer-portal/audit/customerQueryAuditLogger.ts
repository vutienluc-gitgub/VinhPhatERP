/**
 * Customer Portal Query Audit Logger
 *
 * Provides comprehensive console-based audit logging for the Customer Portal's
 * data fetching lifecycle. Specifically designed to identify and diagnose why
 * the UI displays inverted or incorrect information (e.g., reversed customer/staff roles
 * in ChatContextBar, staff canned replies in Customer Portal, or unscoped database queries).
 */

export type QueryLifecyclePhase =
  | 'QUERY_INITIALIZED'
  | 'CACHE_LOOKUP'
  | 'FETCH_DISPATCHED'
  | 'DATA_RECEIVED'
  | 'TRANSFORMATION_APPLIED'
  | 'RENDER_READY'
  | 'ANOMALY_DETECTED'
  | 'QUERY_ERROR';

export type AnomalyType =
  | 'REVERSED_ROLE_CONTEXT'
  | 'STAFF_REPLIES_IN_CUSTOMER_VIEW'
  | 'UNSCOPED_CUSTOMER_QUERY'
  | 'CUSTOMER_ID_MISMATCH'
  | 'UNAUTHORIZED_DATA_ACCESS'
  | 'EMPTY_RECORD_RETURNED';

export interface AuditAnomaly {
  type: AnomalyType;
  title: string;
  observedValue: unknown;
  expectedBehavior: string;
  uiSymptom: string;
  rootCause: string;
  suggestedFix: string;
}

export interface CustomerQueryAuditEntry {
  traceId: string;
  queryName: string;
  phase: QueryLifecyclePhase;
  timestamp: string;
  elapsedMs: number;
  customerId?: string;
  userRole?: string;
  details: Record<string, unknown>;
  anomalies?: AuditAnomaly[];
}

// In-memory ring buffer for audit logs (accessible via window.__CUSTOMER_PORTAL_AUDIT__)
const AUDIT_BUFFER_MAX_SIZE = 250;
const auditLogBuffer: CustomerQueryAuditEntry[] = [];
const recordedAnomalies: Array<AuditAnomaly & { traceId: string; queryName: string; timestamp: string }> = [];

// Color formatting for console badges
const BADGE_STYLES: Record<QueryLifecyclePhase, string> = {
  QUERY_INITIALIZED: 'background: #0284c7; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
  CACHE_LOOKUP: 'background: #475569; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
  FETCH_DISPATCHED: 'background: #2563eb; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
  DATA_RECEIVED: 'background: #16a34a; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
  TRANSFORMATION_APPLIED: 'background: #9333ea; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
  RENDER_READY: 'background: #059669; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
  ANOMALY_DETECTED: 'background: #d97706; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
  QUERY_ERROR: 'background: #dc2626; color: #ffffff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
};

const TITLE_STYLE = 'color: #0284c7; font-weight: 800;';
const ANOMALY_TITLE_STYLE = 'color: #ea580c; font-weight: 800; font-size: 1.05em;';

class QueryTracker {
  public readonly traceId: string;
  public readonly queryName: string;
  public readonly customerId?: string;
  public readonly userRole?: string;
  private readonly startTime: number;
  private lastPhaseTime: number;

  constructor(queryName: string, meta?: { customerId?: string; userRole?: string; caller?: string; [key: string]: unknown }) {
    this.traceId = `cqp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.queryName = queryName;
    this.customerId = meta?.customerId;
    this.userRole = meta?.userRole;
    this.startTime = performance.now();
    this.lastPhaseTime = this.startTime;

    this.recordPhase('QUERY_INITIALIZED', {
      caller: meta?.caller ?? 'unknown',
      initialMetadata: meta,
    });

    console.groupCollapsed(
      `%c[CUSTOMER PORTAL AUDIT]%c %cINIT%c ${queryName} %c[${this.traceId}]`,
      TITLE_STYLE,
      'color: inherit;',
      BADGE_STYLES.QUERY_INITIALIZED,
      'color: inherit; font-weight: bold;',
      'color: #94a3b8; font-size: 0.9em;',
    );
    console.log('Query ID (Trace):', this.traceId);
    console.log('Query Name:', this.queryName);
    console.log('Customer ID in Scope:', this.customerId ?? '(none/unscoped)');
    console.log('User Role in Context:', this.userRole ?? '(none)');
    console.log('Details:', meta);
    console.groupEnd();
  }

  private recordPhase(phase: QueryLifecyclePhase, details: Record<string, unknown>, anomalies?: AuditAnomaly[]) {
    const now = performance.now();
    const elapsedMs = Math.round((now - this.startTime) * 100) / 100;
    this.lastPhaseTime = now;

    const entry: CustomerQueryAuditEntry = {
      traceId: this.traceId,
      queryName: this.queryName,
      phase,
      timestamp: new Date().toISOString(),
      elapsedMs,
      customerId: this.customerId,
      userRole: this.userRole,
      details,
      anomalies,
    };

    auditLogBuffer.push(entry);
    if (auditLogBuffer.length > AUDIT_BUFFER_MAX_SIZE) {
      auditLogBuffer.shift();
    }

    if (anomalies && anomalies.length > 0) {
      for (const a of anomalies) {
        recordedAnomalies.push({
          ...a,
          traceId: this.traceId,
          queryName: this.queryName,
          timestamp: entry.timestamp,
        });
      }
    }

    return entry;
  }

  /**
   * Track Cache Lookup
   */
  public logCacheLookup(cacheKey: unknown[], hit: boolean, cachedData?: unknown) {
    this.recordPhase('CACHE_LOOKUP', {
      cacheKey,
      cacheHit: hit,
      dataPreview: cachedData ? this.sanitizePreview(cachedData) : null,
    });

    console.groupCollapsed(
      `%c[CUSTOMER PORTAL AUDIT]%c %cCACHE%c ${this.queryName} (${hit ? 'HIT' : 'MISS'}) %c[+${this.getDelta()}ms]`,
      TITLE_STYLE,
      'color: inherit;',
      BADGE_STYLES.CACHE_LOOKUP,
      'color: inherit;',
      'color: #94a3b8;',
    );
    console.log('Cache Key:', cacheKey);
    console.log('Cache Status:', hit ? 'HIT (serving from memory)' : 'MISS (fetching network)');
    if (cachedData) console.log('Cached Data Preview:', cachedData);
    console.groupEnd();

    return this;
  }

  /**
   * Track Network Fetch Dispatch
   */
  public logFetch(table: string, queryConfig: { select?: string; filters?: Record<string, unknown>; range?: [number, number]; order?: string }) {
    const isExplicitlyCustomerScoped =
      Boolean(this.customerId) &&
      (queryConfig.filters?.customer_id === this.customerId ||
        JSON.stringify(queryConfig.filters ?? {}).includes(this.customerId!));

    const anomalies: AuditAnomaly[] = [];

    // Anomaly Check: Is this query running on a tenant/customer table without customer scoping?
    if (['orders', 'shipments', 'quotations', 'debt', 'payments'].includes(table) && !isExplicitlyCustomerScoped) {
      const anomaly: AuditAnomaly = {
        type: 'UNSCOPED_CUSTOMER_QUERY',
        title: `Unscoped query dispatched to table "${table}"`,
        observedValue: { table, filters: queryConfig.filters, customerId: this.customerId },
        expectedBehavior: `Query should include .eq('customer_id', '${this.customerId || '<id>'}') to enforce portal tenant isolation.`,
        uiSymptom: 'UI may show all company records or return empty datasets depending on RLS.',
        rootCause: 'Data fetching hook does not append customer_id filter parameter.',
        suggestedFix: `Add .eq('customer_id', customerId) in ${this.queryName} hook.`,
      };
      anomalies.push(anomaly);
    }

    this.recordPhase(
      'FETCH_DISPATCHED',
      {
        table,
        queryConfig,
        isExplicitlyCustomerScoped,
      },
      anomalies.length > 0 ? anomalies : undefined,
    );

    console.groupCollapsed(
      `%c[CUSTOMER PORTAL AUDIT]%c %cDISPATCH%c ${this.queryName} -> ${table} %c[+${this.getDelta()}ms]`,
      TITLE_STYLE,
      'color: inherit;',
      BADGE_STYLES.FETCH_DISPATCHED,
      'color: inherit;',
      'color: #94a3b8;',
    );
    console.log('Target Table/Service:', table);
    console.log('Query Config:', queryConfig);
    console.log('Customer Scoped:', isExplicitlyCustomerScoped ? 'YES (Secure)' : 'NO (Potential Leak or RLS dependency)');
    if (anomalies.length > 0) {
      console.warn('⚠️ AUDIT ANOMALY DETECTED DURING DISPATCH:', anomalies);
    }
    console.groupEnd();

    return this;
  }

  /**
   * Track Raw Data Received
   */
  public logResponse(data: unknown, error: unknown = null, rowCount?: number) {
    const hasError = Boolean(error);
    const count = rowCount ?? (Array.isArray(data) ? data.length : data ? 1 : 0);
    const anomalies: AuditAnomaly[] = [];

    if (!hasError && count === 0 && this.customerId) {
      anomalies.push({
        type: 'EMPTY_RECORD_RETURNED',
        title: `No data returned for customer ${this.customerId}`,
        observedValue: { data, rowCount: 0 },
        expectedBehavior: 'Expected at least one matching customer record or portal state.',
        uiSymptom: 'Blank UI panels or "Chưa có dữ liệu" messages.',
        rootCause: 'Customer ID does not exist in the target table or RLS policy restricts visibility.',
        suggestedFix: 'Verify that customer_id is assigned in user profile and seeded in database.',
      });
    }

    this.recordPhase(
      hasError ? 'QUERY_ERROR' : 'DATA_RECEIVED',
      {
        status: hasError ? 'ERROR' : 'SUCCESS',
        rowCount: count,
        error: error ? String(error) : null,
        dataPreview: this.sanitizePreview(data),
      },
      anomalies.length > 0 ? anomalies : undefined,
    );

    console.groupCollapsed(
      `%c[CUSTOMER PORTAL AUDIT]%c %c${hasError ? 'ERROR' : 'RESPONSE'}%c ${this.queryName} (%c${count} rows%c) %c[+${this.getDelta()}ms]`,
      TITLE_STYLE,
      'color: inherit;',
      hasError ? BADGE_STYLES.QUERY_ERROR : BADGE_STYLES.DATA_RECEIVED,
      'color: inherit;',
      'color: #16a34a; font-weight: bold;',
      'color: inherit;',
      'color: #94a3b8;',
    );
    if (hasError) {
      console.error('Response Error:', error);
    } else {
      console.log('Rows Received:', count);
      console.log('Raw Payload Data:', data);
    }
    if (anomalies.length > 0) {
      console.warn('⚠️ AUDIT ANOMALIES:', anomalies);
    }
    console.groupEnd();

    return this;
  }

  /**
   * Track Data Transformation & Detect Visual/Logical Anomalies
   */
  public logTransform(input: unknown, output: unknown, options?: { contextType?: string; isPortalUser?: boolean }) {
    const anomalies: AuditAnomaly[] = [];

    // Specific Diagnostic for Issue 1: ChatContextBar reversed roles
    // In Customer Portal, the logged in user IS the customer.
    // If output has statusLabel: 'Khách hàng' and detailUrl: '/customers',
    // it was built from the perspective of staff viewing a customer!
    const outObj = output as Record<string, unknown> | null;
    if (outObj && outObj.statusLabel === 'Khách hàng') {
      anomalies.push({
        type: 'REVERSED_ROLE_CONTEXT',
        title: 'Reversed Role Label in Chat Context Bar',
        observedValue: {
          statusLabel: outObj.statusLabel,
          phone: outObj.phone,
          detailUrl: outObj.detailUrl,
          name: outObj.name,
        },
        expectedBehavior:
          'In Customer Portal, the header should display Support Team / Account Manager info (e.g. "Chuyên viên tư vấn" / "Hỗ trợ kỹ thuật"), NOT the customer\'s own badge and phone.',
        uiSymptom:
          'UI displays [Khách hàng] badge with phone and [Chi tiết] linking to internal ERP /customers page.',
        rootCause:
          'useChatContext fetches the customer table record by ID and defaults statusLabel to "Khách hàng" and detailUrl to "/customers" without checking if the current caller is in Customer Portal.',
        suggestedFix:
          'In Customer Portal context, override statusLabel to "Hỗ trợ khách hàng" or "Chuyên viên hỗ trợ" and point detailUrl to customer profile or omit admin link.',
      });
    }

    // Specific Diagnostic for Issue 2: Canned replies for staff loaded in portal
    if (Array.isArray(output)) {
      const hasStaffPhrases = output.some(
        (r) =>
          typeof r === 'string' &&
          (r.includes('Dạ em đã nhận') || r.includes('Dạ em') || r.includes('Dạ đơn') || r.includes('cảm ơn quý khách')),
      );

      if (hasStaffPhrases) {
        anomalies.push({
          type: 'STAFF_REPLIES_IN_CUSTOMER_VIEW',
          title: 'Staff Quick Replies Rendered for Customer',
          observedValue: output,
          expectedBehavior:
            'Quick reply suggestions for customer should be customer inquiries (e.g., "Kiểm tra tiến độ đơn hàng", "Cho tôi xin báo giá mới", "Thời gian giao dự kiến").',
          uiSymptom:
            'Customer sees chips saying "Dạ em đã nhận được thông tin ạ", "Dạ đơn...", which are responses given BY staff, not BY customers.',
          rootCause:
            'CANNED_RESPONSES schema was written from staff/CSKH perspective and rendered globally in ChatQuickReplies without role-awareness.',
          suggestedFix:
            'Provide CUSTOMER_QUICK_REPLIES when entityType === "customer" or when user is in Customer Portal.',
        });
      }
    }

    this.recordPhase(
      'TRANSFORMATION_APPLIED',
      {
        inputPreview: this.sanitizePreview(input),
        outputPreview: this.sanitizePreview(output),
        options,
      },
      anomalies.length > 0 ? anomalies : undefined,
    );

    console.groupCollapsed(
      `%c[CUSTOMER PORTAL AUDIT]%c %cTRANSFORM%c ${this.queryName} %c[+${this.getDelta()}ms]`,
      TITLE_STYLE,
      'color: inherit;',
      BADGE_STYLES.TRANSFORMATION_APPLIED,
      'color: inherit;',
      'color: #94a3b8;',
    );
    console.log('Transformation Input:', input);
    console.log('Transformed UI Model:', output);
    if (anomalies.length > 0) {
      console.warn('%c⚠️ AUDIT ANOMALY DETECTED IN TRANSFORMATION:%c', ANOMALY_TITLE_STYLE, 'color: inherit;');
      for (const a of anomalies) {
        console.group(`Anomaly: ${a.title}`);
        console.log('Symptom on UI:', a.uiSymptom);
        console.log('Observed Value:', a.observedValue);
        console.log('Expected:', a.expectedBehavior);
        console.log('Root Cause:', a.rootCause);
        console.log('Recommendation:', a.suggestedFix);
        console.groupEnd();
      }
    }
    console.groupEnd();

    return this;
  }

  /**
   * Log Anomaly explicitly
   */
  public logAnomaly(anomaly: AuditAnomaly) {
    this.recordPhase('ANOMALY_DETECTED', { anomaly }, [anomaly]);

    console.group(`%c[CUSTOMER PORTAL AUDIT ALERT ⚠️]%c ${anomaly.title}`, ANOMALY_TITLE_STYLE, 'color: inherit;');
    console.warn('UI Symptom:', anomaly.uiSymptom);
    console.warn('Observed Data:', anomaly.observedValue);
    console.warn('Root Cause:', anomaly.rootCause);
    console.warn('Expected Behavior:', anomaly.expectedBehavior);
    console.info('Suggested Fix:', anomaly.suggestedFix);
    console.groupEnd();

    return this;
  }

  /**
   * Log Error
   */
  public logError(error: unknown) {
    this.recordPhase('QUERY_ERROR', { error: String(error) });

    console.group(`%c[CUSTOMER PORTAL AUDIT ERROR ❌]%c ${this.queryName}`, 'color: #dc2626; font-weight: bold;', 'color: inherit;');
    console.error('Error Details:', error);
    console.groupEnd();

    return this;
  }

  /**
   * Mark query lifecycle completed and rendered
   */
  public logComplete(finalState?: unknown) {
    const totalDuration = Math.round((performance.now() - this.startTime) * 100) / 100;
    this.recordPhase('RENDER_READY', {
      totalDurationMs: totalDuration,
      finalStatePreview: this.sanitizePreview(finalState),
    });

    console.log(
      `%c[CUSTOMER PORTAL AUDIT]%c %cCOMPLETE%c ${this.queryName} %c(${totalDuration}ms total)`,
      TITLE_STYLE,
      'color: inherit;',
      BADGE_STYLES.RENDER_READY,
      'color: inherit; font-weight: bold;',
      'color: #059669; font-weight: bold;',
    );

    return this;
  }

  private getDelta(): string {
    const delta = performance.now() - this.lastPhaseTime;
    return delta.toFixed(1);
  }

  private sanitizePreview(val: unknown): unknown {
    if (val === null || val === undefined) return val;
    if (typeof val !== 'object') return val;
    if (Array.isArray(val)) {
      return `Array(${val.length})`;
    }
    const keys = Object.keys(val as object);
    return `Object{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}}`;
  }
}

/**
 * Customer Portal Audit Log Controller
 */
export const customerPortalAudit = {
  /**
   * Begin tracking a customer data fetching query lifecycle
   */
  startQuery(queryName: string, meta?: { customerId?: string; userRole?: string; caller?: string; [key: string]: unknown }) {
    return new QueryTracker(queryName, meta);
  },

  /**
   * Record a standalone anomaly
   */
  recordAnomaly(anomaly: AuditAnomaly, traceId = 'manual') {
    recordedAnomalies.push({
      ...anomaly,
      traceId,
      queryName: 'standalone',
      timestamp: new Date().toISOString(),
    });

    console.group(`%c[CUSTOMER PORTAL AUDIT ALERT ⚠️]%c ${anomaly.title}`, ANOMALY_TITLE_STYLE, 'color: inherit;');
    console.warn('UI Symptom:', anomaly.uiSymptom);
    console.warn('Observed Data:', anomaly.observedValue);
    console.warn('Root Cause:', anomaly.rootCause);
    console.warn('Expected:', anomaly.expectedBehavior);
    console.info('Suggested Fix:', anomaly.suggestedFix);
    console.groupEnd();
  },

  /**
   * Print full diagnostic explanation of why the UI displayed incorrect info in the screenshot
   */
  explainUIErrors() {
    console.group('%c=== [CUSTOMER PORTAL AUDIT] UI DEFECT DIAGNOSTIC REPORT ===', 'color: #0284c7; font-size: 1.2em; font-weight: 900;');
    console.log(
      '%cThis report explains the 2 logical UI discrepancies identified in the Customer Portal screenshot:%c',
      'font-weight: bold; color: #334155;',
      'color: inherit;',
    );

    console.group('%c1. ChatContextBar: Badge "Khách hàng" + SĐT khách + Nút [Chi tiết]%c', 'color: #b45309; font-weight: bold;');
    console.log('• Trạng thái hiện tại: Hiển thị badge [Khách hàng] 0989072670 [Chi tiết].');
    console.log('• Phân tích vòng đời truy vấn:');
    console.log('  1. useChatContext("customer", customerId) truy vấn bảng `customers` theo ID.');
    console.log('  2. Giai đoạn TRANSFORM gán cứng:');
    console.log('     statusLabel = "Khách hàng"');
    console.log('     phone = data.phone (số điện thoại chính khách hàng)');
    console.log('     detailUrl = "/customers" (đường dẫn nội bộ ERP cho Admin/Sales)');
    console.log('• Nguyên nhân gốc: Hàm useChatContext vốn thiết kế cho màn hình nội bộ Admin khi xem Khách, khi tái sử dụng trong Customer Portal đã hiển thị chính thông tin của khách hàng theo góc nhìn bên ngoài.');
    console.log('• Khắc phục khuyến nghị: Khi entityType="customer" trong ngữ cảnh Portal, hiển thị thông tin "Bộ phận Chăm sóc Khách hàng" hoặc "Tư vấn viên Vĩnh Phát" và ẩn URL nội bộ.');
    console.groupEnd();

    console.group('%c2. Quick Replies: Gợi ý tin nhắn "Dạ em đã nhận được thông tin ạ", "Dạ đơn..."%c', 'color: #b45309; font-weight: bold;');
    console.log('• Trạng thái hiện tại: Gợi ý các mẫu câu của nhân viên trực chat.');
    console.log('• Phân tích vòng đời truy vấn:');
    console.log('  1. ChatQuickReplies nạp CANNED_RESPONSES tĩnh.');
    console.log('  2. Các câu mẫu hiện có là câu trả lời của CSKH/Sale.');
    console.log('• Nguyên nhân gốc: Thiếu bộ câu hỏi chuyên biệt cho Portal Người Mua (B2B Buyer Inquiries).');
    console.log('• Khắc phục khuyến nghị: Cung cấp danh sách CUSTOMER_PORTAL_REPLIES:');
    console.log('  - "Kiểm tra tiến độ đơn hàng giúp tôi"');
    console.log('  - "Cho tôi xin tiến độ giao hàng dự kiến"');
    console.log('  - "Gửi lại báo giá cập nhật giúp tôi"');
    console.groupEnd();

    console.log('%cTotal Anomalies Recorded:%c', 'font-weight: bold;', 'color: inherit;', recordedAnomalies.length);
    if (recordedAnomalies.length > 0) {
      console.table(recordedAnomalies);
    }
    console.groupEnd();
  },

  /**
   * Get all entries in buffer
   */
  getLogs() {
    return [...auditLogBuffer];
  },

  /**
   * Get all detected anomalies
   */
  getAnomalies() {
    return [...recordedAnomalies];
  },

  /**
   * Print structured summary table in browser console
   */
  printSummary() {
    console.group('%c[CUSTOMER PORTAL AUDIT SUMMARY TABLE]%c', 'color: #0284c7; font-weight: bold;', 'color: inherit;');
    console.table(
      auditLogBuffer.map((l) => ({
        TraceID: l.traceId,
        Query: l.queryName,
        Phase: l.phase,
        ElapsedMs: `${l.elapsedMs}ms`,
        CustomerID: l.customerId ?? '-',
        Anomalies: l.anomalies?.length ?? 0,
        Time: l.timestamp.split('T')[1].replace('Z', ''),
      })),
    );
    console.groupEnd();
  },

  /**
   * Clear buffer
   */
  clear() {
    auditLogBuffer.length = 0;
    recordedAnomalies.length = 0;
    console.log('%c[CUSTOMER PORTAL AUDIT] Log buffer cleared.%c', 'color: #16a34a;', 'color: inherit;');
  },
};

// Expose on global window object for immediate browser DevTools inspection
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__CUSTOMER_PORTAL_AUDIT__ = customerPortalAudit;
}

export default customerPortalAudit;
