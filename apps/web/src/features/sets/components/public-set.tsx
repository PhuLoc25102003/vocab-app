import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { getPublicSet } from '../public-set';
import { CardList } from './card-list';
import { SetMeta } from './set-meta';

export async function PublicSet({ id }: { id: string }) {
  const set = await getPublicSet(id);
  if (!set) {
    notFound();
  }

  const loginHref = `/login?next=${encodeURIComponent(`/sets/${id}`)}` as Route;

  return (
    <>
      <PageHeader
        title={set.title}
        description={set.description ?? undefined}
        actions={
          <Button asChild>
            <Link href={loginHref}>Đăng nhập để sao chép</Link>
          </Button>
        }
      />
      <SetMeta set={set} />
      {set.cards.length > 0 ? (
        <CardList cards={set.cards} termLang={set.termLang} defLang={set.defLang} />
      ) : (
        <EmptyState title="Bộ từ này chưa có thẻ" description="Hãy quay lại sau nhé." />
      )}
    </>
  );
}
