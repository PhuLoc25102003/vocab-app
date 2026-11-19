import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  LEGAL_UPDATED_AT,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  TERMS_INTRO,
  TERMS_SECTIONS,
} from '../legal-content';
import { LegalPage } from './legal-page';

vi.mock('@/components/common/theme-toggle', () => ({ ThemeToggle: () => null }));

describe('LegalPage', () => {
  it('hiện tiêu đề, ngày cập nhật và các mục có đánh số', () => {
    render(
      <LegalPage
        title="Chính sách bảo mật"
        updatedAt={LEGAL_UPDATED_AT}
        intro={PRIVACY_INTRO}
        sections={PRIVACY_SECTIONS}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chính sách bảo mật');
    expect(screen.getByText(`Cập nhật lần cuối: ${LEGAL_UPDATED_AT}`)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(PRIVACY_SECTIONS.length);
    expect(screen.getByRole('heading', { name: '1. Dữ liệu chúng tôi lưu' })).toBeInTheDocument();
  });

  it('chính sách bảo mật chỉ cách xoá tài khoản', () => {
    render(<LegalPage title="x" updatedAt="" intro={PRIVACY_INTRO} sections={PRIVACY_SECTIONS} />);

    expect(screen.getByRole('link', { name: 'Tài khoản' })).toHaveAttribute('href', '/account');
  });

  it('điều khoản có phần nội dung người dùng tạo', () => {
    render(<LegalPage title="x" updatedAt="" intro={TERMS_INTRO} sections={TERMS_SECTIONS} />);

    expect(screen.getByRole('heading', { name: /Nội dung bạn tạo/ })).toBeInTheDocument();
  });
});
