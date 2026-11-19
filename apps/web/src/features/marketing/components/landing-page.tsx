import Link from 'next/link';
import { BRAND_NAME, Logo } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { Button } from '@/components/ui/button';

const MODES = [
  { name: 'Flashcard', description: 'Lật thẻ, rồi tự chấm xem mình đã nhớ hay chưa.' },
  { name: 'Viết', description: 'Gõ đáp án từ trí nhớ, phần sai được gạch đỏ như khi chấm bài.' },
  { name: 'Nghe viết', description: 'Nghe phát âm rồi viết lại đúng từ vừa nghe.' },
  { name: 'Trắc nghiệm', description: 'Chọn đáp án đúng khi muốn ôn nhanh.' },
];

const STEPS = [
  { title: 'Chuẩn bị bộ từ', description: 'Tự tạo bộ từ của bạn hoặc tìm bộ từ công khai.' },
  { title: 'Luyện tập', description: 'Chọn chế độ hợp với bạn, đổi chế độ bất cứ lúc nào.' },
  {
    title: 'Ôn đúng lúc',
    description: 'Mục Ôn hôm nay gom các thẻ đến hạn, Tổng quan cho thấy bạn đã đi được bao xa.',
  },
];

const START_LINK = {
  guest: { href: '/register', label: 'Tạo tài khoản' },
  member: { href: '/dashboard', label: 'Vào học tiếp' },
} as const;

function SampleCard() {
  return (
    <figure className="flex w-full max-w-md flex-col">
      <div className="paper-grid flex min-h-44 flex-col items-center justify-center gap-1 rounded-lg border border-border p-6 shadow-raised">
        <span className="font-card text-card">remember</span>
        <span className="bg-surface px-2 font-phonetic text-text-muted">/rɪˈmɛmbər/</span>
      </div>
      <div className="-mt-4 ml-8 flex min-h-24 items-center justify-center rounded-lg bg-board p-4 text-board-fg shadow-raised">
        <span className="font-card text-h2">ghi nhớ</span>
      </div>
      <figcaption className="sr-only">Thẻ mẫu: từ remember, nghĩa là ghi nhớ.</figcaption>
    </figure>
  );
}

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-2 px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <SessionLink
              variant="secondary"
              guest={{ href: '/login', label: 'Đăng nhập' }}
              member={{ href: '/dashboard', label: 'Trang của tôi' }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-16 px-4 py-12 md:px-6 lg:px-8 lg:py-16">
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex max-w-[65ch] flex-col items-start gap-6">
            <h1 className="font-card text-card">Từ nào sắp quên, ôn đúng lúc đó.</h1>
            <p className="text-text-muted">
              {BRAND_NAME} giúp bạn học từ vựng bằng flashcard, viết, nghe và trắc nghiệm, rồi tự
              xếp lịch ôn cho từng thẻ.
            </p>
            <div className="flex flex-wrap gap-2">
              <SessionLink {...START_LINK} />
              <Button asChild variant="secondary">
                <Link href="/explore">Khám phá bộ từ</Link>
              </Button>
            </div>
          </div>
          <SampleCard />
        </section>

        <section aria-labelledby="modes-heading" className="flex flex-col gap-4">
          <h2 id="modes-heading" className="text-h2">
            Bốn cách luyện một bộ từ
          </h2>
          <dl className="border-t border-border">
            {MODES.map(({ name, description }) => (
              <div
                key={name}
                className="flex flex-col gap-1 border-b border-border py-4 sm:flex-row sm:gap-6"
              >
                <dt className="font-card text-h3 sm:w-48 sm:shrink-0">{name}</dt>
                <dd className="text-text-muted">{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="steps-heading" className="flex flex-col gap-4">
          <h2 id="steps-heading" className="text-h2">
            Học mỗi ngày trong ba bước
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ title, description }, index) => (
              <li key={title} className="flex flex-col gap-1 border-t border-border-strong pt-3">
                <span className="text-small text-text-muted tabular-nums">Bước {index + 1}</span>
                <h3 className="text-h3">{title}</h3>
                <p className="text-text-muted">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="start-heading" className="flex flex-col items-start gap-3">
          <h2 id="start-heading" className="text-h2">
            Bắt đầu với bộ từ đầu tiên
          </h2>
          <p className="max-w-[65ch] text-text-muted">
            Bạn có thể học thử các bộ từ công khai ngay, không cần tài khoản.
          </p>
          <SessionLink {...START_LINK} />
        </section>
      </main>
    </div>
  );
}
