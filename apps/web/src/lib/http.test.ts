import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureHttpAuth, http, HttpError } from './http';

const unauthorized = () =>
  new Response(
    JSON.stringify({
      error: { code: 'TOKEN_EXPIRED', message: 'Hết hạn', details: null, requestId: 'r1' },
    }),
    { status: 401 },
  );
const success = () => new Response(JSON.stringify({ data: 'ok' }), { status: 200 });

describe('http', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const refreshAccessToken = vi.fn<() => Promise<string | null>>();
  const sentToken = (call: number) =>
    new Headers(fetchMock.mock.calls[call]?.[1]?.headers).get('Authorization');

  beforeEach(() => {
    fetchMock.mockReset();
    refreshAccessToken.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    configureHttpAuth({ getAccessToken: () => 'cu', refreshAccessToken });
  });

  afterEach(() => {
    configureHttpAuth(null);
    vi.unstubAllGlobals();
  });

  it('gửi access token và cookie', async () => {
    fetchMock.mockResolvedValue(success());

    await expect(http('/users/me')).resolves.toEqual({ data: 'ok' });

    expect(sentToken(0)).toBe('Bearer cu');
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include');
  });

  it('refresh một lần rồi gửi lại request khi gặp 401', async () => {
    fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(success());
    refreshAccessToken.mockResolvedValue('moi');

    await expect(http('/users/me')).resolves.toEqual({ data: 'ok' });

    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(sentToken(1)).toBe('Bearer moi');
  });

  it('không lặp vô hạn khi request gửi lại vẫn 401', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(unauthorized()));
    refreshAccessToken.mockResolvedValue('moi');

    await expect(http('/users/me')).rejects.toBeInstanceOf(HttpError);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('trả lỗi gốc khi không refresh được', async () => {
    fetchMock.mockResolvedValue(unauthorized());
    refreshAccessToken.mockResolvedValue(null);

    await expect(http('/users/me')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
  });

  it('skipAuth không gửi token và không refresh', async () => {
    fetchMock.mockResolvedValue(unauthorized());

    await expect(http('/auth/login', { skipAuth: true })).rejects.toBeInstanceOf(HttpError);

    expect(sentToken(0)).toBeNull();
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});
