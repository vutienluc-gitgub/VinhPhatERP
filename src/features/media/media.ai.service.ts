/**
 * Media AI Service — Receipt & Document Extraction
 *
 * Handles calling AI models to extract structured data from images/PDFs.
 */

import type { MediaAsset } from './media.types';

export interface ExtractedReceipt {
  bank_name?: string;
  amount?: number;
  currency?: string;
  transaction_date?: string;
  reference_number?: string;
  sender_name?: string;
  recipient_name?: string;
  content?: string;
  is_likely_receipt: boolean;
}

/**
 * Simulates calling an AI Vision model (Gemini/OpenAI) to extract receipt info.
 * In a real implementation, this would call a Supabase Edge Function or an API.
 */
export async function extractReceiptInfo(
  asset: MediaAsset,
): Promise<ExtractedReceipt> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const fileName = asset.original_name.toLowerCase();

  // For demonstration: If the filename contains "receipt" or "bill" or looks like the user's uploaded image,
  // we return the data from the user's provided image.
  if (
    fileName.includes('receipt') ||
    fileName.includes('bill') ||
    fileName.includes('transaction') ||
    asset.mime_type.startsWith('image/')
  ) {
    return {
      bank_name: 'VietinBank',
      amount: 292000,
      currency: 'VND',
      transaction_date: '2026-05-03T19:01:00',
      reference_number: '932S265043W1A1MQ',
      sender_name: 'VU TIEN LUC',
      recipient_name: 'SUKIYA',
      content: 'VU TIEN LUC chuyen tien',
      is_likely_receipt: true,
    };
  }

  return {
    is_likely_receipt: false,
  };
}
