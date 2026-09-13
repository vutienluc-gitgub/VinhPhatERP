import { describe, it, expect } from 'vitest';

import { DuplicateGuardService } from '../duplicate-guard.service.js';

describe('DuplicateGuardService', () => {
  const guard = new DuplicateGuardService();

  it('computes deterministic SHA-256 hash from image bytes', () => {
    const bytes1 = Buffer.from('synthetic-yarn-slip-image-content-1');
    const bytes2 = Buffer.from('synthetic-yarn-slip-image-content-1');
    const bytes3 = Buffer.from('synthetic-yarn-slip-image-content-2');

    const hash1 = guard.computeImageHash(bytes1);
    const hash2 = guard.computeImageHash(bytes2);
    const hash3 = guard.computeImageHash(bytes3);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('skips database query when supplierId or documentNumber is absent', async () => {
    const bytes = Buffer.from('image-sample');
    const result = await guard.checkDuplicate({
      imageBytes: bytes,
      supplierId: null,
      documentNumber: null,
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.imageHash).toBeDefined();
    expect(result.warningMessage).toBeUndefined();
  });

  it('detects duplicate image hash from history cache', async () => {
    const testGuard = new DuplicateGuardService();
    const imageBytes = Buffer.from('unique-test-yarn-slip-scan-image');
    const imageHash = testGuard.computeImageHash(imageBytes);

    // Initial check: not duplicate
    const check1 = await testGuard.checkDuplicate({ imageBytes });
    expect(check1.isDuplicate).toBe(false);

    // Record the image hash
    testGuard.recordImageHash(imageHash, { receiptNumber: 'PC-2026-09-001' });
    expect(testGuard.getImageHashCount()).toBe(1);

    // Second check: should detect duplicate by IMAGE_HASH
    const check2 = await testGuard.checkDuplicate({ imageBytes });
    expect(check2.isDuplicate).toBe(true);
    expect(check2.duplicateType).toBe('IMAGE_HASH');
    expect(check2.warningMessage).toContain('PC-2026-09-001');

    // Reset/clear
    testGuard.clearImageHashes();
    expect(testGuard.getImageHashCount()).toBe(0);

    const check3 = await testGuard.checkDuplicate({ imageBytes });
    expect(check3.isDuplicate).toBe(false);
  });

  it('evicts expired image hashes based on retention window', async () => {
    // Retention of 10 milliseconds
    const shortLivedGuard = new DuplicateGuardService(10);
    const imageBytes = Buffer.from('short-lived-image-content');
    const imageHash = shortLivedGuard.computeImageHash(imageBytes);

    shortLivedGuard.recordImageHash(imageHash);
    expect(shortLivedGuard.getImageHashCount()).toBe(1);

    // Sleep 25ms to expire
    await new Promise((resolve) => setTimeout(resolve, 25));

    const check = await shortLivedGuard.checkDuplicate({ imageBytes });
    expect(check.isDuplicate).toBe(false);
    expect(shortLivedGuard.getImageHashCount()).toBe(0);
  });
});
