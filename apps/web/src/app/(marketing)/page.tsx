import { HealthStatus } from '@/components/common/health-status';
import { BRAND_NAME } from '@/components/common/logo';
import { ThemeToggle } from '@/components/common/theme-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const swatches = [
  { name: 'bg', className: 'bg-bg' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'border', className: 'bg-border' },
  { name: 'border-strong', className: 'bg-border-strong' },
  { name: 'rule', className: 'bg-rule' },
  { name: 'text', className: 'bg-text' },
  { name: 'text-muted', className: 'bg-text-muted' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'primary-hover', className: 'bg-primary-hover' },
  { name: 'primary-soft', className: 'bg-primary-soft' },
  { name: 'board', className: 'bg-board' },
  { name: 'board-muted', className: 'bg-board-muted' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'danger-mark', className: 'bg-danger-mark' },
  { name: 'danger-soft', className: 'bg-danger-soft' },
  { name: 'success', className: 'bg-success' },
  { name: 'success-mark', className: 'bg-success-mark' },
  { name: 'success-soft', className: 'bg-success-soft' },
  { name: 'highlight', className: 'bg-highlight' },
  { name: 'focus', className: 'bg-focus' },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1">{BRAND_NAME}</h1>
          <p className="text-text-muted">Trang tạm để kiểm tra design token và kết nối API.</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="secondary">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>
      </header>

      <section aria-labelledby="health-title" className="flex flex-col gap-2">
        <h2 id="health-title" className="text-h2">
          Trạng thái hệ thống
        </h2>
        <HealthStatus />
      </section>

      <section aria-labelledby="colors-title" className="flex flex-col gap-3">
        <h2 id="colors-title" className="text-h2">
          Màu
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((swatch) => (
            <li key={swatch.name} className="flex flex-col gap-1 text-small">
              <span className={`h-12 rounded-md border border-border ${swatch.className}`} />
              {swatch.name}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="parts-title" className="flex flex-col gap-3">
        <h2 id="parts-title" className="text-h2">
          Thành phần
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Nút primary</Button>
          <mark className="rounded-sm bg-highlight px-2 py-1 text-highlight-fg">Từ cần nhớ</mark>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-h-36 flex-col items-center justify-center gap-1 rounded-lg bg-board p-6 text-board-fg shadow-raised">
            <span className="font-card text-card">vocabulary</span>
            <span className="font-phonetic text-board-muted">/vəˈkæbjəˌlɛri/</span>
            <span className="font-card">từ vựng</span>
          </div>
          <div className="paper-grid flex min-h-36 items-center justify-center rounded-lg border border-border p-6 shadow-raised">
            <span className="bg-surface px-2 text-small text-text-muted">paper-grid</span>
          </div>
        </div>
      </section>
    </main>
  );
}
