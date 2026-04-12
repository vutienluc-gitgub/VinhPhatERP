/**
 * Supabase Edge Function: generate-contract
 * ==========================================
 * Tạo Contract từ Order / Customer / Supplier với đầy đủ business logic:
 *
 * STEP 1: Auth & validate input
 * STEP 2: Validate nguồn (từ chối Order cancelled, Customer/Supplier inactive)
 * STEP 3: Cảnh báo nếu Order đã có Contract liên kết (không chặn)
 * STEP 4: Lấy thông tin Party_A từ bảng tương ứng
 * STEP 5: Lấy thông tin Party_B từ bảng settings
 * STEP 6: Lấy template active phù hợp với type
 * STEP 7: Đánh số hợp đồng atomic (SELECT MAX + FOR UPDATE trong transaction)
 * STEP 8: Render template (thay thế tất cả {{placeholder}})
 * STEP 9: Insert contracts (status = 'draft')
 * STEP 10: Insert contract_order_links nếu source_type = 'order'
 * STEP 11: Insert contract_audit_logs (action = 'created')
 *
 * Deploy: supabase functions deploy generate-contract
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SourceType = 'order' | 'customer' | 'supplier';
type ContractType = 'sale' | 'purchase';

interface GenerateContractRequest {
  source_type: SourceType;
  source_id: string;
  type: ContractType;
  effective_date?: string;
  expiry_date?: string;
  payment_term?: string;
  notes?: string;
}

interface PartyAInfo {
  id: string;
  type: 'customer' | 'supplier';
  name: string;
  address: string | null;
  tax_code: string | null;
  representative: string | null;
  title: string | null;
}

interface PartyBInfo {
  name: string;
  address: string | null;
  tax_code: string | null;
  bank_account: string | null;
  bank_name: string | null;
  representative: string | null;
  representative_title: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(
  code: string,
  message: string,
  detail?: unknown,
  status = 400,
): Response {
  return jsonResponse(
    {
      ok: false,
      error: {
        code,
        message,
        detail,
      },
    },
    status,
  );
}

/**
 * Tạo số hợp đồng theo định dạng: {seq:03d}/{năm}/HĐNT–{prefix}/TKS
 */
function formatContractNumber(
  seq: number,
  year: number,
  prefix: string,
): string {
  const seqPadded = String(seq).padStart(3, '0');
  return `${seqPadded}/${year}/HĐNT\u2013${prefix}/TKS`;
}

/**
 * Render template: thay thế tất cả {{placeholder}} bằng dữ liệu thực.
 * Placeholder không có trong data giữ nguyên.
 */
function renderTemplate(
  content: string,
  data: Record<string, string | null | undefined>,
): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
    const trimmedKey = key.trim();
    const value = data[trimmedKey];
    return value != null ? value : _match;
  });
}

/**
 * Lấy giá trị setting từ mảng settings rows.
 */
function getSetting(
  settings: Array<{ key: string; value: string }>,
  key: string,
): string | null {
  return settings.find((s) => s.key === key)?.value ?? null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── STEP 1: Auth ────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(
        'UNAUTHORIZED',
        'Missing Authorization header',
        null,
        401,
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Invalid token', null, 401);
    }

    // Kiểm tra profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return errorResponse(
        'FORBIDDEN',
        'Không tìm thấy profile người dùng',
        null,
        403,
      );
    }
    if (!profile.is_active) {
      return errorResponse('FORBIDDEN', 'Tài khoản bị vô hiệu hoá', null, 403);
    }

    // ── Parse & validate input ──────────────────────────────────────────
    const body: GenerateContractRequest = await req.json();
    const {
      source_type,
      source_id,
      type,
      effective_date,
      expiry_date,
      payment_term,
      notes,
    } = body;

    if (
      !source_type ||
      !['order', 'customer', 'supplier'].includes(source_type)
    ) {
      return errorResponse(
        'VALIDATION',
        'source_type phải là order, customer hoặc supplier',
      );
    }
    if (!source_id) {
      return errorResponse('VALIDATION', 'source_id không được để trống');
    }
    if (!type || !['sale', 'purchase'].includes(type)) {
      return errorResponse('VALIDATION', 'type phải là sale hoặc purchase');
    }

    // ── STEP 2: Validate nguồn & lấy Party_A ───────────────────────────
    let partyA: PartyAInfo;
    let sourceOrderId: string | null = null;
    let existingContractWarning: string | null = null;

    if (source_type === 'order') {
      // Lấy order kèm customer
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select(
          `
          id, status,
          customers (
            id, name, address, tax_code, representative, representative_title, status, payment_term
          )
        `,
        )
        .eq('id', source_id)
        .single();

      if (orderErr || !order) {
        return errorResponse('NOT_FOUND', 'Không tìm thấy đơn hàng', null, 404);
      }

      // Từ chối nếu Order cancelled
      if (order.status === 'cancelled') {
        return errorResponse(
          'ORDER_CANCELLED',
          'Không thể tạo hợp đồng cho đơn hàng đã huỷ.',
          null,
          422,
        );
      }

      const customer = Array.isArray(order.customers)
        ? order.customers[0]
        : order.customers;

      if (!customer) {
        return errorResponse(
          'NOT_FOUND',
          'Không tìm thấy thông tin khách hàng của đơn hàng',
          null,
          404,
        );
      }

      // Từ chối nếu Customer inactive
      if (customer.status === 'inactive') {
        return errorResponse(
          'CUSTOMER_INACTIVE',
          'Không thể tạo hợp đồng cho đối tác không còn hoạt động.',
          null,
          422,
        );
      }

      sourceOrderId = order.id;
      partyA = {
        id: customer.id,
        type: 'customer',
        name: customer.name,
        address: customer.address ?? null,
        tax_code: customer.tax_code ?? null,
        representative: customer.representative ?? null,
        title: customer.representative_title ?? null,
      };

      // STEP 3: Cảnh báo nếu Order đã có Contract liên kết
      const { data: existingLinks } = await supabaseAdmin
        .from('contract_order_links')
        .select('contract_id')
        .eq('order_id', source_id)
        .limit(1);

      if (existingLinks && existingLinks.length > 0) {
        existingContractWarning =
          'Đơn hàng này đã có hợp đồng. Bạn có muốn tạo hợp đồng mới không?';
      }
    } else if (source_type === 'customer') {
      const { data: customer, error: custErr } = await supabaseAdmin
        .from('customers')
        .select(
          'id, name, address, tax_code, representative, representative_title, status',
        )
        .eq('id', source_id)
        .single();

      if (custErr || !customer) {
        return errorResponse(
          'NOT_FOUND',
          'Không tìm thấy khách hàng',
          null,
          404,
        );
      }

      if (customer.status === 'inactive') {
        return errorResponse(
          'CUSTOMER_INACTIVE',
          'Không thể tạo hợp đồng cho đối tác không còn hoạt động.',
          null,
          422,
        );
      }

      partyA = {
        id: customer.id,
        type: 'customer',
        name: customer.name,
        address: customer.address ?? null,
        tax_code: customer.tax_code ?? null,
        representative: customer.representative ?? null,
        title: customer.representative_title ?? null,
      };
    } else {
      // source_type === 'supplier'
      const { data: supplier, error: suppErr } = await supabaseAdmin
        .from('suppliers')
        .select(
          'id, name, address, tax_code, representative, representative_title, status',
        )
        .eq('id', source_id)
        .single();

      if (suppErr || !supplier) {
        return errorResponse(
          'NOT_FOUND',
          'Không tìm thấy nhà cung cấp',
          null,
          404,
        );
      }

      if (supplier.status === 'inactive') {
        return errorResponse(
          'SUPPLIER_INACTIVE',
          'Không thể tạo hợp đồng cho đối tác không còn hoạt động.',
          null,
          422,
        );
      }

      partyA = {
        id: supplier.id,
        type: 'supplier',
        name: supplier.name,
        address: supplier.address ?? null,
        tax_code: supplier.tax_code ?? null,
        representative: supplier.representative ?? null,
        title: supplier.representative_title ?? null,
      };
    }

    // ── STEP 5: Lấy Party_B từ settings ────────────────────────────────
    const settingKeys = [
      'company_name',
      'company_address',
      'company_tax_code',
      'company_representative',
      'company_representative_title',
      'company_bank_account',
      'company_bank_name',
      'contract_sale_prefix',
      'contract_purchase_prefix',
    ];

    const { data: settingsRows, error: settingsErr } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', settingKeys);

    if (settingsErr) {
      return errorResponse(
        'DB_ERROR',
        `Lỗi đọc settings: ${settingsErr.message}`,
        null,
        500,
      );
    }

    const settings = settingsRows ?? [];
    const partyB: PartyBInfo = {
      name:
        getSetting(settings, 'company_name') ??
        'Công Ty TNHH Dệt May Vĩnh Phát',
      address: getSetting(settings, 'company_address'),
      tax_code: getSetting(settings, 'company_tax_code'),
      bank_account: getSetting(settings, 'company_bank_account'),
      bank_name: getSetting(settings, 'company_bank_name'),
      representative: getSetting(settings, 'company_representative'),
      representative_title: getSetting(
        settings,
        'company_representative_title',
      ),
    };

    const contractPrefix =
      type === 'sale'
        ? (getSetting(settings, 'contract_sale_prefix') ?? 'ĐKKH')
        : (getSetting(settings, 'contract_purchase_prefix') ?? 'ĐKNH');

    // ── STEP 6: Lấy template active phù hợp với type ───────────────────
    const { data: template, error: templateErr } = await supabaseAdmin
      .from('contract_templates')
      .select('id, content')
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (templateErr || !template) {
      return errorResponse(
        'TEMPLATE_NOT_FOUND',
        'Không tìm thấy mẫu hợp đồng phù hợp. Vui lòng liên hệ quản trị viên.',
        null,
        404,
      );
    }

    // ── STEP 7: Đánh số hợp đồng atomic ────────────────────────────────
    // Dùng SELECT MAX(seq) trong năm hiện tại để tính seq tiếp theo.
    // Thực hiện trong RPC để đảm bảo atomic (FOR UPDATE).
    const currentYear = new Date().getFullYear();

    const { data: seqResult, error: seqErr } = await supabaseAdmin.rpc(
      'fn_next_contract_seq',
      {
        p_year: currentYear,
        p_type: type,
      },
    );

    if (seqErr) {
      // Fallback: tính thủ công nếu RPC chưa tồn tại
      console.warn(
        '[generate-contract] fn_next_contract_seq RPC not found, using fallback:',
        seqErr.message,
      );

      const yearStart = `${currentYear}-01-01T00:00:00.000Z`;
      const yearEnd = `${currentYear + 1}-01-01T00:00:00.000Z`;

      const { data: maxSeqData } = await supabaseAdmin
        .from('contracts')
        .select('contract_number')
        .gte('created_at', yearStart)
        .lt('created_at', yearEnd)
        .like('contract_number', `%/${currentYear}/%`)
        .order('created_at', { ascending: false });

      let nextSeq = 1;
      if (maxSeqData && maxSeqData.length > 0) {
        // Parse seq từ contract_number đầu tiên (format: 001/2026/...)
        const seqStr = maxSeqData[0].contract_number.split('/')[0];
        const parsed = parseInt(seqStr, 10);
        if (!isNaN(parsed)) {
          nextSeq = parsed + 1;
        }
      }

      const contractNumber = formatContractNumber(
        nextSeq,
        currentYear,
        contractPrefix,
      );

      return await insertContract({
        supabaseAdmin,
        userId: user.id,
        contractNumber,
        type,
        template,
        partyA,
        partyB,
        sourceOrderId,
        effectiveDate: effective_date ?? null,
        expiryDate: expiry_date ?? null,
        paymentTerm: payment_term ?? null,
        notes: notes ?? null,
        existingContractWarning,
        contractPrefix,
        currentYear,
      });
    }

    const nextSeq: number = seqResult ?? 1;
    const contractNumber = formatContractNumber(
      nextSeq,
      currentYear,
      contractPrefix,
    );

    return await insertContract({
      supabaseAdmin,
      userId: user.id,
      contractNumber,
      type,
      template,
      partyA,
      partyB,
      sourceOrderId,
      effectiveDate: effective_date ?? null,
      expiryDate: expiry_date ?? null,
      paymentTerm: payment_term ?? null,
      notes: notes ?? null,
      existingContractWarning,
      contractPrefix,
      currentYear,
    });
  } catch (err) {
    console.error('[generate-contract] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', String(err), null, 500);
  }
});

// ---------------------------------------------------------------------------
// insertContract: STEP 8–11
// ---------------------------------------------------------------------------

interface InsertContractParams {
  supabaseAdmin: ReturnType<typeof createClient>;
  userId: string;
  contractNumber: string;
  type: ContractType;
  template: { id: string; content: string };
  partyA: PartyAInfo;
  partyB: PartyBInfo;
  sourceOrderId: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  paymentTerm: string | null;
  notes: string | null;
  existingContractWarning: string | null;
  contractPrefix: string;
  currentYear: number;
}

async function insertContract(params: InsertContractParams): Promise<Response> {
  const {
    supabaseAdmin,
    userId,
    contractNumber,
    type,
    template,
    partyA,
    partyB,
    sourceOrderId,
    effectiveDate,
    expiryDate,
    paymentTerm,
    notes,
    existingContractWarning,
  } = params;

  // STEP 8: Render template
  const today = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const templateData: Record<string, string | null | undefined> = {
    contract_number: contractNumber,
    contract_date: today,
    party_a_name: partyA.name,
    party_a_address: partyA.address,
    party_a_tax_code: partyA.tax_code,
    party_a_representative: partyA.representative,
    party_a_title: partyA.title,
    party_b_name: partyB.name,
    party_b_address: partyB.address,
    party_b_tax_code: partyB.tax_code,
    party_b_bank_account: partyB.bank_account
      ? `${partyB.bank_account}${partyB.bank_name ? ` – ${partyB.bank_name}` : ''}`
      : null,
    party_b_representative: partyB.representative,
    payment_term: paymentTerm,
    effective_date: effectiveDate,
    expiry_date: expiryDate,
  };

  const renderedContent = renderTemplate(template.content, templateData);

  // STEP 9: Insert vào contracts
  const { data: contract, error: contractErr } = await supabaseAdmin
    .from('contracts')
    .insert({
      contract_number: contractNumber,
      type,
      status: 'draft',
      content: renderedContent,
      template_id: template.id,
      party_a_type: partyA.type,
      party_a_id: partyA.id,
      party_a_name: partyA.name,
      party_a_address: partyA.address,
      party_a_tax_code: partyA.tax_code,
      party_a_representative: partyA.representative,
      party_a_title: partyA.title,
      party_b_name: partyB.name,
      party_b_address: partyB.address,
      party_b_tax_code: partyB.tax_code,
      party_b_bank_account: partyB.bank_account,
      party_b_representative: partyB.representative,
      payment_term: paymentTerm,
      effective_date: effectiveDate || null,
      expiry_date: expiryDate || null,
      notes: notes || null,
      source_order_id: sourceOrderId,
      created_by: userId,
    })
    .select('id, contract_number, status')
    .single();

  if (contractErr || !contract) {
    console.error('[generate-contract] Insert contract error:', contractErr);
    return errorResponse(
      'INSERT_FAILED',
      `Tạo hợp đồng thất bại: ${contractErr?.message ?? 'Unknown error'}`,
      null,
      500,
    );
  }

  // STEP 10: Insert contract_order_links nếu source_type = 'order'
  if (sourceOrderId) {
    const { error: linkErr } = await supabaseAdmin
      .from('contract_order_links')
      .insert({
        contract_id: contract.id,
        order_id: sourceOrderId,
        linked_by: userId,
      });

    if (linkErr) {
      console.error(
        '[generate-contract] Insert contract_order_links error:',
        linkErr,
      );
      // Không rollback contract — link lỗi không phải lỗi nghiêm trọng
    }
  }

  // STEP 11: Insert audit log
  const { error: auditErr } = await supabaseAdmin
    .from('contract_audit_logs')
    .insert({
      contract_id: contract.id,
      action: 'created',
      old_values: null,
      new_values: {
        contract_number: contractNumber,
        type,
        status: 'draft',
        party_a_name: partyA.name,
        source_order_id: sourceOrderId,
      },
      performed_by: userId,
    });

  if (auditErr) {
    console.error('[generate-contract] Insert audit log error:', auditErr);
    // Không fail request vì audit log lỗi
  }

  return new Response(
    JSON.stringify({
      ok: true,
      contract_id: contract.id,
      contract_number: contract.contract_number,
      status: contract.status,
      warning: existingContractWarning ?? undefined,
      message: `Hợp đồng ${contractNumber} đã được tạo thành công.`,
    }),
    {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
}
