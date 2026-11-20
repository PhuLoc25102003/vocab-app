import { createHash, createHmac } from 'node:crypto';

export interface PresignInput {
  method: 'GET' | 'PUT';
  host: string;
  /** Đường dẫn chưa mã hoá, bắt đầu bằng `/`. */
  path: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  date: Date;
  expiresInSeconds: number;
  /** Header ngoài `host` mà người tải lên phải gửi đúng giá trị, ví dụ `content-type`. */
  headers?: Record<string, string>;
}

/** Mã hoá theo RFC 3986 như AWS yêu cầu. */
const encode = (value: string) =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const hmac = (key: Buffer | string, value: string) =>
  createHmac('sha256', key).update(value).digest();

/**
 * Tạo URL ký sẵn theo AWS Signature Version 4 (query string), dùng được cho S3 và R2.
 * https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
 */
export function presignUrl(input: PresignInput): string {
  const stamp = input.date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const day = stamp.slice(0, 8);
  const scope = `${day}/${input.region}/${input.service}/aws4_request`;
  const headers = Object.fromEntries(
    Object.entries({ ...input.headers, host: input.host }).map(([name, value]) => [
      name.toLowerCase(),
      value.trim(),
    ]),
  );
  const headerNames = Object.keys(headers).sort();
  const signedHeaders = headerNames.join(';');

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${input.accessKeyId}/${scope}`,
    'X-Amz-Date': stamp,
    'X-Amz-Expires': String(input.expiresInSeconds),
    'X-Amz-SignedHeaders': signedHeaders,
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${encode(name)}=${encode(query[name] ?? '')}`)
    .join('&');
  const canonicalPath = input.path.split('/').map(encode).join('/');
  const canonicalRequest = [
    input.method,
    canonicalPath,
    canonicalQuery,
    headerNames.map((name) => `${name}:${headers[name]}\n`).join(''),
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    stamp,
    scope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');
  const signingKey = [input.region, input.service, 'aws4_request'].reduce<Buffer>(
    (key, part) => hmac(key, part),
    hmac(`AWS4${input.secretAccessKey}`, day),
  );
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  return `https://${input.host}${canonicalPath}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
