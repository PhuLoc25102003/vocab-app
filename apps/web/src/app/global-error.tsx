'use client';

import { ErrorState } from '@/components/common/error-state';
import { themeInitScript } from '@/lib/theme';
import './globals.css';

/** Thay cả layout gốc khi layout gốc bị lỗi, nên phải tự có `html` và `body`. */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <title>Đã có lỗi xảy ra</title>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-8">
          <ErrorState
            title="Đã có lỗi xảy ra"
            description="Hãy thử lại. Nếu vẫn lỗi, tải lại trang sau ít phút."
            onRetry={retry}
          />
        </main>
      </body>
    </html>
  );
}
