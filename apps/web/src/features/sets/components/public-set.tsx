import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BackLink } from '@/components/common/back-link';
import { CopyLinkButton } from '@/components/common/copy-link-button';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SessionLink } from '@/components/common/session-link';
import { Button } from '@/components/ui/button';
import { getPublicSet } from '../public-set';
import { CardList } from './card-list';
import { SetMeta } from './set-meta';
import { StudyModeGrid } from './study-mode-grid';

/**
 * Trang của khách khi mở đường dẫn chia sẻ hoặc vào từ Khám phá.
 * Người đã đăng nhập được `proxy` chuyển sang `/sets/:id` trước khi tới đây.
 */
export async function PublicSet({ id }: { id: string }) {
  const set = await getPublicSet(id);
  if (!set) {
    notFound();
  }

  const detailPath = `/sets/${id}`;
  const loginHref = `/login?next=${encodeURIComponent(detailPath)}` as Route;
  const registerHref = `/register?next=${encodeURIComponent(detailPath)}` as Route;

  return (
    <>
      <BackLink href="/explore" label="Quay lại Khám phá" />
      <PageHeader
        title={set.title}
        description={set.description ?? undefined}
        actions={
          <>
            <CopyLinkButton path={`/public/sets/${id}`} />
            <SessionLink
              variant="secondary"
              guest={{ href: loginHref, label: 'Đăng nhập để sao chép' }}
              member={{ href: detailPath as Route, label: 'Mở trong tài khoản' }}
            />
          </>
        }
      />
      <SetMeta set={set} />
      {set.cards.length > 0 ? (
        <>
          <StudyModeGrid setId={id} guest />
          <CardList cards={set.cards} termLang={set.termLang} defLang={set.defLang} />
          <section
            aria-labelledby="guest-signup-title"
            className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-primary bg-primary-soft p-4"
          >
            <div className="flex max-w-[52ch] flex-col gap-1">
              <h2 id="guest-signup-title" className="text-h3">
                Muốn nhớ lâu bộ từ này?
              </h2>
              <p className="text-small text-text-muted">
                Tạo tài khoản miễn phí để sao chép bộ từ, lưu tiến độ và được nhắc ôn đúng lúc.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={registerHref}>Tạo tài khoản</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={loginHref}>Đăng nhập</Link>
              </Button>
            </div>
          </section>
        </>
      ) : (
        <EmptyState title="Bộ từ này chưa có thẻ" description="Hãy quay lại sau nhé." />
      )}
    </>
  );
}
