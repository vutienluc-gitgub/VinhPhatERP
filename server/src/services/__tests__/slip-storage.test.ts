import { describe, it, expect, vi, beforeEach } from 'vitest';

import { serverSupabase } from '../../db/supabase.js';
import { SlipStorageService } from '../slip-storage.service.js';

describe('SlipStorageService', () => {
  let service: SlipStorageService;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new SlipStorageService();
  });

  const sampleBytes = Buffer.from('synthetic-yarn-slip-image-bytes');
  const sampleHash =
    'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

  it('uploads to primary bucket yarn-slips and returns public URL', async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          'https://test.supabase.co/storage/v1/object/public/yarn-slips/a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90.jpg',
      },
    });

    vi.spyOn(serverSupabase.storage, 'from').mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    } as never);

    const result = await service.uploadSlipImage({
      fileBytes: sampleBytes,
      mimeType: 'image/jpeg',
      imageHash: sampleHash,
      fileName: 'phieu_can.jpg',
    });

    expect(result).not.toBeNull();
    expect(result?.bucket).toBe('yarn-slips');
    expect(result?.storagePath).toBe(`${sampleHash}.jpg`);
    expect(result?.publicUrl).toContain('yarn-slips');
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to public-media bucket when primary bucket fails', async () => {
    const fromMock = vi.fn((bucket: string) => {
      if (bucket === 'yarn-slips') {
        return {
          upload: vi.fn().mockResolvedValue({
            error: new Error('Bucket yarn-slips not found'),
          }),
          getPublicUrl: vi.fn(),
        };
      }
      return {
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: {
            publicUrl: `https://test.supabase.co/storage/v1/object/public/public-media/yarn-slips/${sampleHash}.png`,
          },
        }),
      };
    });

    vi.spyOn(serverSupabase.storage, 'from').mockImplementation(
      fromMock as never,
    );

    const result = await service.uploadSlipImage({
      fileBytes: sampleBytes,
      mimeType: 'image/png',
      imageHash: sampleHash,
      fileName: 'phieu_can.png',
    });

    expect(result).not.toBeNull();
    expect(result?.bucket).toBe('public-media');
    expect(result?.storagePath).toBe(`yarn-slips/${sampleHash}.png`);
    expect(result?.publicUrl).toContain('public-media');
  });

  it('returns null gracefully when all storage options fail', async () => {
    vi.spyOn(serverSupabase.storage, 'from').mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        error: new Error('Network timeout connecting to storage'),
      }),
      getPublicUrl: vi.fn(),
    } as never);

    const result = await service.uploadSlipImage({
      fileBytes: sampleBytes,
      mimeType: 'image/webp',
      imageHash: sampleHash,
    });

    expect(result).toBeNull();
  });
});
