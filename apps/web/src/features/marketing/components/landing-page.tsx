import {
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Layers,
  ListChecks,
  Mic,
  PenLine,
  Shuffle,
  Sparkles,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { BRAND_NAME } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { Button } from '@/components/ui/button';
import { MarketingShell } from './marketing-shell';

const MODES: { name: string; description: string; icon: LucideIcon }[] = [
  { name: 'Flashcard', description: 'Lật thẻ, tự chấm đã nhớ hay chưa.', icon: Layers },
  { name: 'Học kỹ', description: 'Trắc nghiệm rồi gõ từ, câu sai hỏi lại.', icon: GraduationCap },
  { name: 'Viết', description: 'Gõ từ từ trí nhớ, phần sai gạch đỏ.', icon: PenLine },
  { name: 'Nghe viết', description: 'Nghe phát âm, viết lại từ vừa nghe.', icon: Headphones },
  { name: 'Trắc nghiệm', description: 'Chọn nghĩa đúng khi muốn ôn nhanh.', icon: ListChecks },
  { name: 'Điền từ', description: 'Điền từ còn thiếu vào câu ví dụ.', icon: TextCursorInput },
  { name: 'Ghép cặp', description: 'Ghép từ với nghĩa thật nhanh.', icon: Shuffle },
  { name: 'Kiểm tra', description: 'Làm bài nhiều dạng, chấm khi nộp.', icon: ClipboardCheck },
  { name: 'Luyện nói', description: 'Đọc to từ, máy nghe và chấm.', icon: Mic },
];

const SCHEDULE = [
  { when: 'Hôm nay', what: 'Học thẻ mới' },
  { when: 'Sau 1 ngày', what: 'Ôn lần đầu' },
  { when: 'Sau 6 ngày', what: 'Đúng tiếp thì đã thuộc' },
  { when: 'Về sau', what: 'Lịch giãn dần, nhớ lâu' },
];

const STEPS = [
  { title: 'Chuẩn bị bộ từ', description: 'Tự tạo, nhập từ Excel hoặc chọn bộ công khai.' },
  { title: 'Luyện tập', description: 'Chọn chế độ hợp với bạn, đổi bất cứ lúc nào.' },
  { title: 'Ôn đúng lúc', description: 'Ôn hôm nay gom thẻ đến hạn, Tổng quan cho thấy tiến bộ.' },
];

const HIGHLIGHTS = ['9 chế độ học', 'Lịch ôn tự động', 'Miễn phí'];

const START_LINK = {
  guest: { href: '/register', label: 'Tạo tài khoản' },
  member: { href: '/dashboard', label: 'Vào học tiếp' },
} as const;

function SampleCards() {
  return (
    <figure className="relative mx-auto flex h-72 w-full max-w-md items-center justify-center">
      <div
        aria-hidden
        className="landing-float-slow absolute top-2 left-4 flex h-32 w-52 -rotate-6 items-center justify-center rounded-lg border border-border bg-surface shadow-raised"
      >
        <span className="font-card text-h2 text-text-muted">vocabulary</span>
      </div>
      <div className="landing-float paper-grid relative flex h-44 w-72 flex-col items-center justify-center gap-1 rounded-lg border border-border shadow-raised">
        <span className="font-card text-card">remember</span>
        <span className="font-phonetic text-small text-text-muted">/rɪˈmem.bər/</span>
      </div>
      <div
        aria-hidden
        className="landing-float-slow absolute right-2 bottom-2 flex h-20 w-44 rotate-3 items-center justify-center rounded-lg bg-board text-board-fg shadow-raised"
      >
        <span className="font-card text-h3">ghi nhớ</span>
      </div>
      <figcaption className="sr-only">Thẻ mẫu: từ remember, nghĩa là ghi nhớ.</figcaption>
    </figure>
  );
}

export function LandingPage() {
  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-24 px-4 py-12 md:px-6 lg:px-8 lg:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div className="landing-enter flex max-w-[65ch] flex-col items-start gap-6">
            <p className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-small font-medium text-primary">
              <Sparkles aria-hidden className="size-4" />
              Học từ vựng có lịch ôn riêng cho từng thẻ
            </p>
            <h1 className="font-card text-card">Từ nào sắp quên, ôn đúng lúc đó.</h1>
            <p className="text-text-muted">
              {BRAND_NAME} giúp bạn học từ vựng bằng flashcard, viết, nghe, nói và trắc nghiệm, rồi
              tự xếp lịch ôn để bạn nhớ lâu mà không phải học dồn.
            </p>
            <div className="flex flex-wrap gap-2">
              <SessionLink {...START_LINK} />
              <Button asChild variant="secondary">
                <Link href="/explore">Khám phá bộ từ</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-2 text-small">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="rounded-full border border-border-strong px-3 py-1">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <SampleCards />
        </section>

        <section aria-labelledby="modes-heading" className="landing-reveal flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="modes-heading" className="text-h2">
              Chín cách luyện một bộ từ
            </h2>
            <p className="max-w-[65ch] text-text-muted">
              Đổi cách học để não không quen lối mòn: nhìn, viết, nghe, nói đều được.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map(({ name, description, icon: Icon }) => (
              <li
                key={name}
                className="flex items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors duration-fast ease-standard hover:border-primary"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="font-card text-h3">{name}</span>
                  <span className="text-small text-text-muted">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="schedule-heading" className="landing-reveal flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="schedule-heading" className="flex items-center gap-2 text-h2">
              <CalendarClock aria-hidden className="size-6 text-primary" />
              Lịch ôn tự giãn theo trí nhớ của bạn
            </h2>
            <p className="max-w-[65ch] text-text-muted">
              Trả lời đúng thì thẻ được hẹn ôn xa hơn, sai thì quay lại sớm. Một từ được tính là đã
              thuộc khi bạn nhớ đúng ở hai ngày khác nhau.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCHEDULE.map(({ when, what }, index) => (
              <li key={when} className="flex flex-col gap-1 border-t-4 border-primary pt-3">
                <span className="text-small text-text-muted tabular-nums">Mốc {index + 1}</span>
                <span className="text-h3">{when}</span>
                <span className="text-text-muted">{what}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="steps-heading" className="landing-reveal flex flex-col gap-6">
          <h2 id="steps-heading" className="text-h2">
            Học mỗi ngày trong ba bước
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ title, description }, index) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-card text-h2 text-primary-fg"
                >
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="sr-only">Bước {index + 1}:</span>
                  <h3 className="text-h3">{title}</h3>
                  <p className="text-text-muted">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="start-heading"
          className="landing-reveal flex flex-col items-start gap-4 rounded-lg bg-board p-8 text-board-fg md:p-12"
        >
          <h2 id="start-heading" className="font-card text-h1">
            Bắt đầu với bộ từ đầu tiên
          </h2>
          <p className="max-w-[65ch] text-board-muted">
            Bạn có thể học thử các bộ từ công khai ngay, không cần tài khoản.
          </p>
          <SessionLink {...START_LINK} />
        </section>
      </main>
    </MarketingShell>
  );
}
