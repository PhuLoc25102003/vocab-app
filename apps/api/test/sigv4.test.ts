import { describe, expect, it } from 'vitest';
import { R2Storage } from '../src/infrastructure/storage/object-storage';
import { presignUrl } from '../src/infrastructure/storage/sigv4';

describe('presignUrl', () => {
  it('khớp ví dụ URL ký sẵn trong tài liệu AWS', () => {
    const url = presignUrl({
      method: 'GET',
      host: 'examplebucket.s3.amazonaws.com',
      path: '/test.txt',
      region: 'us-east-1',
      service: 's3',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      date: new Date('2013-05-24T00:00:00Z'),
      expiresInSeconds: 86_400,
    });

    expect(url).toBe(
      'https://examplebucket.s3.amazonaws.com/test.txt' +
        '?X-Amz-Algorithm=AWS4-HMAC-SHA256' +
        '&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request' +
        '&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host' +
        '&X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404',
    );
  });
});

describe('R2Storage', () => {
  it('ký PUT kèm dung lượng và loại ảnh, trả địa chỉ công khai', () => {
    const storage = new R2Storage(
      {
        accountId: 'acc',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        bucket: 'vocab-media',
        publicUrl: 'https://pub.r2.dev/',
      },
      () => new Date('2026-11-20T00:00:00Z'),
    );

    const upload = storage.presignPut({
      key: 'cards/u1/a.png',
      contentType: 'image/png',
      size: 2048,
      expiresInSeconds: 300,
    });

    const url = new URL(upload.uploadUrl);
    expect(url.host).toBe('acc.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/vocab-media/cards/u1/a.png');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('X-Amz-Credential')).toBe('key/20261120/auto/s3/aws4_request');
    expect(upload.headers).toEqual({ 'content-type': 'image/png' });
    expect(upload.publicUrl).toBe('https://pub.r2.dev/cards/u1/a.png');
  });
});
