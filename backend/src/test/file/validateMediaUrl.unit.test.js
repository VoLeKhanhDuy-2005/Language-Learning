import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockS3Send } = vi.hoisted(() => ({ mockS3Send: vi.fn() }));

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    // eslint-disable-next-line prefer-arrow-callback
    S3Client: vi.fn(function () {
      return { send: mockS3Send };
    }),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));

const { validateMediaUrl } = await import('../../modules/file/file.service.js');

const BASE = 'https://s3.example.com';
const LEGACY = 'https://assets.parroto.app';
const USER_ID = 'user123';

const s3Url = (purpose, userId = USER_ID, file = 'abc.webp') => {
  const prefix = {
    'card-image': 'cards',
    'shadowing-audio': 'shadowing',
    'deck-import': 'imports',
  };
  return `${BASE}/${prefix[purpose]}/${userId}/${file}`;
};

beforeEach(() => {
  process.env.S3_PUBLIC_BASE_URL = BASE;
  process.env.S3_LEGACY_BASE_URL = LEGACY;
  process.env.BUCKET_NAME = 'test-bucket';
  process.env.AWS_ACCESS_KEY = 'key';
  process.env.AWS_SECRET_ACCESS_KEY = 'secret';
  process.env.BUCKET_REGION = 'us-east-1';
  mockS3Send.mockReset();
});

describe('validateMediaUrl', () => {
  describe('invalid purpose', () => {
    it('throws 400 INVALID_PURPOSE for unknown purpose', async () => {
      await expect(
        validateMediaUrl(`${BASE}/x/y/z.png`, 'unknown-purpose', USER_ID)
      ).rejects.toMatchObject({ code: 'INVALID_PURPOSE', statusCode: 400 });
      expect(mockS3Send).not.toHaveBeenCalled();
    });
  });

  describe('unchanged URL fast-path (PUT)', () => {
    it('returns null without hitting S3 when url === currentUrl', async () => {
      const current = s3Url('shadowing-audio');
      const result = await validateMediaUrl(
        current,
        'shadowing-audio',
        USER_ID,
        current
      );
      expect(result).toBeNull();
      expect(mockS3Send).not.toHaveBeenCalled();
    });
  });

  describe('legacy URL (assets.parroto.app)', () => {
    it('returns null on POST (no currentUrl)', async () => {
      const result = await validateMediaUrl(
        `${LEGACY}/cards/user123/old.jpg`,
        'card-image',
        USER_ID
      );
      expect(result).toBeNull();
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('throws 403 on PUT when a different legacy URL is submitted', async () => {
      await expect(
        validateMediaUrl(
          `${LEGACY}/cards/user123/new.jpg`,
          'card-image',
          USER_ID,
          `${LEGACY}/cards/user123/old.jpg`
        )
      ).rejects.toMatchObject({
        code: 'KEY_OWNERSHIP_MISMATCH',
        statusCode: 403,
      });
      expect(mockS3Send).not.toHaveBeenCalled();
    });
  });

  describe('new S3 upload', () => {
    it('throws 403 when URL does not start with S3_PUBLIC_BASE_URL', async () => {
      await expect(
        validateMediaUrl(
          'https://evil.com/cards/user123/file.png',
          'card-image',
          USER_ID
        )
      ).rejects.toMatchObject({
        code: 'KEY_OWNERSHIP_MISMATCH',
        statusCode: 403,
      });
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('throws 403 when key prefix does not match the purpose', async () => {
      // shadowing prefix under card-image purpose
      await expect(
        validateMediaUrl(
          `${BASE}/shadowing/${USER_ID}/file.webm`,
          'card-image',
          USER_ID
        )
      ).rejects.toMatchObject({
        code: 'KEY_OWNERSHIP_MISMATCH',
        statusCode: 403,
      });
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('throws 403 when userId in key does not match caller', async () => {
      await expect(
        validateMediaUrl(
          s3Url('card-image', 'other-user'),
          'card-image',
          USER_ID
        )
      ).rejects.toMatchObject({
        code: 'KEY_OWNERSHIP_MISMATCH',
        statusCode: 403,
      });
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('throws 404 UPLOAD_NOT_FOUND when HeadObject fails', async () => {
      mockS3Send.mockRejectedValue(new Error('NoSuchKey'));
      await expect(
        validateMediaUrl(s3Url('card-image'), 'card-image', USER_ID)
      ).rejects.toMatchObject({ code: 'UPLOAD_NOT_FOUND', statusCode: 404 });
      expect(mockS3Send).toHaveBeenCalledOnce();
    });

    it('returns the extracted key on a valid URL with successful HeadObject', async () => {
      mockS3Send.mockResolvedValue({});
      const url = s3Url('card-image');
      const result = await validateMediaUrl(url, 'card-image', USER_ID);
      expect(result).toBe(`cards/${USER_ID}/abc.webp`);
      expect(mockS3Send).toHaveBeenCalledOnce();
    });

    it('validates a new S3 URL on PUT even when currentUrl differs', async () => {
      mockS3Send.mockResolvedValue({});
      const newUrl = s3Url('shadowing-audio', USER_ID, 'new.webm');
      const result = await validateMediaUrl(
        newUrl,
        'shadowing-audio',
        USER_ID,
        s3Url('shadowing-audio', USER_ID, 'old.webm')
      );
      expect(result).toBe(`shadowing/${USER_ID}/new.webm`);
      expect(mockS3Send).toHaveBeenCalledOnce();
    });
  });
});
