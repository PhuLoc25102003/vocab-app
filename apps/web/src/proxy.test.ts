import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

const requestTo = (path: string, signedIn = false) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: signedIn ? { cookie: 'vocab_session=1' } : {},
  });

describe('proxy', () => {
  it('chuyển khách về đăng nhập và giữ trang đang mở', () => {
    const response = proxy(requestTo('/sets?page=2'));

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?next=%2Fsets%3Fpage%3D2',
    );
  });

  it('cho người có phiên vào trang trong app', () => {
    expect(proxy(requestTo('/dashboard', true)).headers.get('location')).toBeNull();
  });

  it('đưa người có phiên ra khỏi trang đăng nhập', () => {
    expect(proxy(requestTo('/login', true)).headers.get('location')).toBe(
      'http://localhost:3000/dashboard',
    );
  });

  it('đưa người có phiên tới trang trong next', () => {
    expect(proxy(requestTo('/login?next=%2Fsets%2Fabc', true)).headers.get('location')).toBe(
      'http://localhost:3000/sets/abc',
    );
  });

  it('không lặp lại khi next là trang đăng nhập', () => {
    expect(proxy(requestTo('/login?next=%2Flogin', true)).headers.get('location')).toBe(
      'http://localhost:3000/dashboard',
    );
  });

  it('không theo next trỏ ra trang ngoài', () => {
    expect(proxy(requestTo('/login?next=%2F%2Fevil.example', true)).headers.get('location')).toBe(
      'http://localhost:3000/dashboard',
    );
  });

  it('cho khách vào trang đăng ký', () => {
    expect(proxy(requestTo('/register')).headers.get('location')).toBeNull();
  });
});
