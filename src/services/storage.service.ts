import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../config/s3';
import { env } from '../config/env';

function normalizeObjectKey(rawUrl: string): string {
  if (rawUrl.startsWith('s3://')) {
    const withoutProtocol = rawUrl.slice('s3://'.length);
    const slashIndex = withoutProtocol.indexOf('/');

    if (slashIndex === -1) {
      return withoutProtocol;
    }

    return withoutProtocol.slice(slashIndex + 1);
  }

  return rawUrl.replace(/^\/+/, '');
}

function buildS3Url(objectKey: string): string {
  return `s3://${env.S3_BUCKET}/${objectKey}`;
}

export async function createSignedDownloadUrl(fileUrl: string): Promise<{ url: string; expiresIn: number; objectKey: string }> {
  const objectKey = normalizeObjectKey(fileUrl);

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: env.S3_SIGNED_URL_TTL_SECONDS,
  });

  return {
    url,
    expiresIn: env.S3_SIGNED_URL_TTL_SECONDS,
    objectKey,
  };
}

export async function uploadPrivateTextFile(input: {
  objectKey: string;
  body: string;
  contentType: string;
}): Promise<{ fileUrl: string; objectKey: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: input.objectKey,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return {
    fileUrl: buildS3Url(input.objectKey),
    objectKey: input.objectKey,
  };
}
