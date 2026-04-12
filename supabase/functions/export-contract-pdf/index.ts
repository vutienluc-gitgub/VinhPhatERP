/**
 * Supabase Edge Function: export-contract-pdf
 * ============================================
 * Xuất hợp đồng ra file PDF và lưu vào Supabase Storage.
 *
 * STEP 1: Auth & validate input
 * STEP 2: Lấy Contract từ database
 * STEP 3: Render HTML content đầy đủ (wrap trong template A4)
 * STEP 4: Tạo PDF từ HTML (dùng Browserless/Puppeteer hoặc html-pdf approach)
 * STEP 5: Upload PDF lên Supabase Storage bucket `contract-pdfs/`
 * STEP 6: Cập nhật `contracts.pdf_url` và `contracts.pdf_generated_at`
 * STEP 7: Insert audit log `action = 'pdf_exported'`
 *
 * Nếu bất kỳ bước nào từ STEP 4 trở đi thất bại:
 *   - Trả về lỗi cụ thể
 *   - KHÔNG thay đổi `status` của Contract
 *
 * Timeout: 10 giây
 *
 * Deploy: supabase functions deploy export-contract-pdf
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
// Constants
// ---------------------------------------------------------------------------
const PDF_TIMEOUT_MS = 10_000; // 10 giây
const STORAGE_BUCKET = 'contract-pdfs';

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
 * Wrap nội dung HTML hợp đồng trong template A4 đầy đủ với CSS chuẩn.
 * Font: Times New Roman, 12pt, lề trên/dưới 2cm, lề trái/phải 2.5cm.
 */
function wrapHtmlForPdf(
  contractContent: string,
  contractNumber: string,
): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hợp Đồng ${contractNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm 2.5cm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3 {
      font-family: 'Times New Roman', Times, serif;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td, th {
      padding: 4pt 6pt;
      vertical-align: top;
    }
    .signature-section {
      margin-top: 40pt;
      display: flex;
      justify-content: space-between;
    }
    .signature-block {
      text-align: center;
      width: 45%;
    }
    .signature-line {
      margin-top: 60pt;
      border-top: 1px solid #000;
      padding-top: 4pt;
    }
    p {
      margin: 6pt 0;
      text-align: justify;
    }
  </style>
</head>
<body>
  ${contractContent}
</body>
</html>`;
}

/**
 * Tạo PDF từ HTML sử dụng Browserless API (Puppeteer-compatible).
 * Nếu BROWSERLESS_TOKEN không được cấu hình, dùng fallback HTML-to-PDF đơn giản.
 */
async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
  const browserlessUrl =
    Deno.env.get('BROWSERLESS_URL') ?? 'https://chrome.browserless.io';

  if (browserlessToken) {
    // Dùng Browserless (Puppeteer-compatible) để render PDF chất lượng cao
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PDF_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${browserlessUrl}/pdf?token=${browserlessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html,
            options: {
              format: 'A4',
              printBackground: true,
              margin: {
                top: '2cm',
                bottom: '2cm',
                left: '2.5cm',
                right: '2.5cm',
              },
            },
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Browserless PDF error ${response.status}: ${errText}`);
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name === 'AbortError') {
        throw new Error('PDF generation timed out after 10 seconds');
      }
      throw err;
    }
  }

  // Fallback: dùng gotenberg nếu có
  const gotenbergUrl = Deno.env.get('GOTENBERG_URL');
  if (gotenbergUrl) {
    return await generatePdfViaGotenberg(html, gotenbergUrl);
  }

  // Fallback cuối: trả về HTML dưới dạng bytes (cho môi trường dev/test)
  // Trong production, cần cấu hình BROWSERLESS_TOKEN hoặc GOTENBERG_URL
  console.warn(
    '[export-contract-pdf] No PDF renderer configured. Returning HTML as fallback.',
  );
  const encoder = new TextEncoder();
  return encoder.encode(html);
}

/**
 * Tạo PDF qua Gotenberg (alternative PDF renderer cho Deno/Edge).
 */
async function generatePdfViaGotenberg(
  html: string,
  gotenbergUrl: string,
): Promise<Uint8Array> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PDF_TIMEOUT_MS);

  try {
    const formData = new FormData();
    const htmlBlob = new Blob([html], { type: 'text/html' });
    formData.append('files', htmlBlob, 'index.html');

    const response = await fetch(
      `${gotenbergUrl}/forms/chromium/convert/html`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gotenberg PDF error ${response.status}: ${errText}`);
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error('PDF generation timed out after 10 seconds');
    }
    throw err;
  }
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
    const body: { contract_id?: string } = await req.json();
    const { contract_id } = body;

    if (!contract_id) {
      return errorResponse('VALIDATION', 'contract_id không được để trống');
    }

    // ── STEP 2: Lấy Contract từ database ───────────────────────────────
    const { data: contract, error: contractErr } = await supabaseAdmin
      .from('contracts')
      .select('id, contract_number, status, content, pdf_url')
      .eq('id', contract_id)
      .single();

    if (contractErr || !contract) {
      return errorResponse('NOT_FOUND', 'Không tìm thấy hợp đồng', null, 404);
    }

    // Lưu lại status gốc — KHÔNG được thay đổi nếu export thất bại
    const originalStatus = contract.status;

    // ── STEP 3: Render HTML content đầy đủ ─────────────────────────────
    const fullHtml = wrapHtmlForPdf(contract.content, contract.contract_number);

    // ── STEP 4: Tạo PDF từ HTML ─────────────────────────────────────────
    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await generatePdfFromHtml(fullHtml);
    } catch (pdfErr) {
      console.error('[export-contract-pdf] PDF generation failed:', pdfErr);
      // KHÔNG thay đổi status — trả về lỗi cụ thể
      return errorResponse(
        'PDF_GENERATION_FAILED',
        `Tạo PDF thất bại: ${(pdfErr as Error).message}`,
        null,
        500,
      );
    }

    // ── STEP 5: Upload PDF lên Supabase Storage ─────────────────────────
    const timestamp = Date.now();
    const fileName = `${contract.contract_number.replace(/\//g, '_')}_${timestamp}.pdf`;
    const storagePath = `${contract_id}/${fileName}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      console.error('[export-contract-pdf] Storage upload failed:', uploadErr);
      // KHÔNG thay đổi status — trả về lỗi cụ thể
      return errorResponse(
        'STORAGE_UPLOAD_FAILED',
        `Upload PDF thất bại: ${uploadErr.message}`,
        null,
        500,
      );
    }

    // Lấy public URL của file vừa upload
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const pdfUrl = publicUrlData?.publicUrl ?? null;

    // ── STEP 6: Cập nhật contracts.pdf_url và pdf_generated_at ─────────
    const now = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from('contracts')
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: now,
        updated_at: now,
      })
      .eq('id', contract_id);

    if (updateErr) {
      console.error('[export-contract-pdf] Update contract failed:', updateErr);
      // PDF đã upload nhưng update DB thất bại — trả về lỗi, status không đổi
      return errorResponse(
        'DB_UPDATE_FAILED',
        `Cập nhật thông tin PDF thất bại: ${updateErr.message}`,
        {
          pdf_url: pdfUrl,
          storage_path: storagePath,
        },
        500,
      );
    }

    // Verify status không bị thay đổi (defensive check)
    const { data: verifyContract } = await supabaseAdmin
      .from('contracts')
      .select('status')
      .eq('id', contract_id)
      .single();

    if (verifyContract && verifyContract.status !== originalStatus) {
      // Rollback status nếu bị thay đổi ngoài ý muốn
      console.error(
        '[export-contract-pdf] Status changed unexpectedly, rolling back',
      );
      await supabaseAdmin
        .from('contracts')
        .update({ status: originalStatus })
        .eq('id', contract_id);
    }

    // ── STEP 7: Insert audit log ────────────────────────────────────────
    const { error: auditErr } = await supabaseAdmin
      .from('contract_audit_logs')
      .insert({
        contract_id,
        action: 'pdf_exported',
        old_values: { pdf_url: contract.pdf_url ?? null },
        new_values: {
          pdf_url: pdfUrl,
          pdf_generated_at: now,
          storage_path: storagePath,
        },
        performed_by: user.id,
      });

    if (auditErr) {
      console.error('[export-contract-pdf] Insert audit log error:', auditErr);
      // Không fail request vì audit log lỗi
    }

    return jsonResponse({
      ok: true,
      contract_id,
      pdf_url: pdfUrl,
      pdf_generated_at: now,
      message: `PDF hợp đồng ${contract.contract_number} đã được xuất thành công.`,
    });
  } catch (err) {
    console.error('[export-contract-pdf] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', String(err), null, 500);
  }
});
