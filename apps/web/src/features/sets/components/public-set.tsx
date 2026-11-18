import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SessionLink } from '@/components/common/session-link';
import { STUDY_ENTRIES } from '../labels';
import { getPublicSet } from '../public-set';
import { CardList } from './card-list';
import { SetMeta } from './set-meta';

export async function PublicSet({ id }: { id: string }) {
  const set = await getPublicSet(id);
  if (!set) {
    notFound();
  }

  const detailPath = `/sets/${id}`;
  const loginHref = `/login?next=${encodeURIComponent(detailPath)}` as Route;

  return (
    <>
      <PageHeader
        title={set.title}
        description={set.description ?? undefined}
        actions={
          <SessionLink
            variant="secondary"
            guest={{ href: loginHref, label: 'Đăng nhập để sao chép' }}
            member={{ href: detailPath as Route, label: 'Mở trong tài khoản' }}
          />
        }
      />
      <SetMeta set={set} />
      {set.cards.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {STUDY_ENTRIES.map(({ slug, label, guestLabel }, index) => (
              <SessionLink
                key={slug}
                variant={index === 0 ? 'primary' : 'secondary'}
                guest={{ href: `/public/sets/${id}/study/${slug}` as Route, label: guestLabel }}
                member={{ href: `${detailPath}/study/${slug}` as Route, label }}
              />
            ))}
          </div>
          <CardList cards={set.cards} termLang={set.termLang} defLang={set.defLang} />
        </>
      ) : (
        <EmptyState title="Bộ từ này chưa có thẻ" description="Hãy quay lại sau nhé." />
      )}
    </>
  );
}
