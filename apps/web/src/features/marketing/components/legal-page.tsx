'use client';

import type { ReactNode } from 'react';
import { MarketingShell } from './marketing-shell';
import { useTranslation } from 'react-i18next';

export interface LegalSection {
  title: string;
  body: ReactNode[];
}

interface LegalPageProps {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

/** Trang văn bản dài như chính sách bảo mật, điều khoản sử dụng. */
export function LegalPage({ title, updatedAt, intro, sections }: LegalPageProps) {
  const { t } = useTranslation('marketing');
  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-12 md:px-6 lg:px-8">
        <article className="flex max-w-[65ch] flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-h1">{title}</h1>
            <p className="text-small text-text-muted">
              {t('legal.updatedAt', { date: updatedAt })}
            </p>
            <p className="text-text-muted">{intro}</p>
          </header>
          {sections.map(({ title: heading, body }, index) => (
            <section key={heading} className="flex flex-col gap-2">
              <h2 className="text-h3">
                {index + 1}. {heading}
              </h2>
              {body.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>
      </main>
    </MarketingShell>
  );
}
