import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import 'dotenv';
import AppError from '../../utils/AppError.js';
import { FILE } from '../../constants/codes/index.js';
import { UPLOAD_CONFIG, EXT_BY_TYPE } from '../../constants/upload.config.js';

const bucketName = process.env.BUCKET_NAME;
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex');

// Build the public/CDN URL served to clients from a stored S3 key.
export const buildPublicUrl = (key) =>
  key
    ? `${(process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '')}/${key}`
    : null;

const legacyBase = () =>
  (process.env.S3_LEGACY_BASE_URL || 'https://assets.parroto.app').replace(
    /\/$/,
    ''
  );

export const validateMediaUrl = async (url, purpose, userId, currentUrl) => {
  const config = UPLOAD_CONFIG[purpose];
  if (!config) throw new AppError(FILE.INVALID_PURPOSE, 400);

  if (currentUrl !== undefined && url === currentUrl) return null;

  if (url.startsWith(`${legacyBase()}/`)) {
    if (currentUrl !== undefined)
      throw new AppError(FILE.KEY_OWNERSHIP_MISMATCH, 403);
    return null;
  }

  const base = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!url.startsWith(`${base}/`))
    throw new AppError(FILE.KEY_OWNERSHIP_MISMATCH, 403);
  const key = url.slice(base.length + 1);
  if (!key.startsWith(`${config.prefix}/${userId}/`))
    throw new AppError(FILE.KEY_OWNERSHIP_MISMATCH, 403);
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
  } catch {
    throw new AppError(FILE.UPLOAD_NOT_FOUND, 404);
  }
  return key;
};

export const getFileBufferFromS3 = async (key) => {
  // S3 không trả file trực tiếp nó trả dạng stream gồm các chunks
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );
    const stream = response.Body;
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks); // gom chunks lại thành file hoàn chỉnh
  } catch (error) {
    throw new AppError(FILE.UPLOAD_NOT_FOUND, 404, [], 'File not found on S3');
  }
};

export const extractKeyFromUrl = (url) => {
  const base = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!url || !url.startsWith(`${base}/`)) {
    throw new AppError(
      FILE.KEY_OWNERSHIP_MISMATCH,
      400,
      [],
      'url is invalid or not belong to this bucket'
    );
  }
  return url.slice(base.length + 1); //cắt bỏ phần base URL và dấu / phía sau, lấy ra phần S3 key
};

// Sign a one-time PUT URL so the client uploads straight to S3.
// The key is generated server-side (scoped by userId) — never taken
// from the client — and the contentType is baked into the signature.
export const createUploadPresignedUrl = async (
  { contentType, purpose, fileSize },
  userId
) => {
  const config = UPLOAD_CONFIG[purpose];
  if (!config) throw new AppError(FILE.INVALID_PURPOSE, 400);

  if (!config.allowedTypes.includes(contentType)) {
    throw new AppError(
      FILE.CONTENT_TYPE_NOT_ALLOWED,
      400,
      [],
      `Content type is not allowed for "${purpose}"`
    );
  }

  if (fileSize > config.maxSize) {
    throw new AppError(
      FILE.FILE_TOO_LARGE,
      400,
      [],
      `File exceeds the ${config.maxSize / (1024 * 1024)}MB limit`
    );
  }

  const ext = EXT_BY_TYPE[contentType] || 'bin';
  const key = `${config.prefix}/${userId}/${randomImageName(16)}.${ext}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    }),
    { expiresIn: 60 } // 60 seconds
  );

  return { uploadUrl, key, url: buildPublicUrl(key), expiresIn: 60 };
};
