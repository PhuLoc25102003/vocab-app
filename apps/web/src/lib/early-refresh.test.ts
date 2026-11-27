import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refresh } from '@/features/auth/api';
import { APP_PATH_PREFIXES, earlyRefreshScript, takeEarlyRefresh } from './early-refresh';

const API = 'https://api.example.com/api/v1';
const session = { data: { user: { id: 'u1' }, accessToken: 'moi' } };
const run = (path: string) => {
  window.history.replaceState(null, '', path);
  new Function(earlyRefreshScript(API))();
};

describe('làm mới phiên sớm', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(session)));
    vi.stubGlobal('fetch', fetchMock);
    document.cookie = 'vocab_session=1; Path=/';
  });

  afterEach(() => {
    takeEarlyRefresh();
    document.cookie = 'vocab_session=; Path=/; Max-Age=0';
    window.history.replaceState(null, '', '/');
    vi.unstubAllGlobals();
  });

  it('danh sách đường dẫn khớp các thư mục của nhóm (app)', () => {
    const dir = join(process.cwd(), 'src', 'app', '(app)');
    const routes = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/${entry.name}`)
      .sort();
    expect([...APP_PATH_PREFIXES].sort()).toEqual(routes);
  });

  it('trang trong app có cookie phiên thì gửi refresh ngay, refresh() dùng lại kết quả một lần', async () => {
    run('/sets/abc');
    expect(fetchMock).toHaveBeenCalledWith(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    await expect(refresh()).resolves.toEqual(session.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(takeEarlyRefresh()).toBeNull();
  });

  it('không gửi khi chưa có phiên hoặc không ở trang trong app', () => {
    run('/login');
    run('/');
    run('/setsx');
    document.cookie = 'vocab_session=; Path=/; Max-Age=0';
    run('/dashboard');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(takeEarlyRefresh()).toBeNull();
  });

  it('request sớm lỗi mạng thì refresh() gửi lại như thường', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('mất mạng'));
    run('/dashboard');

    await expect(refresh()).resolves.toEqual(session.data);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
