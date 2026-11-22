'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SetDetail, SetSummary, Visibility } from '@vocab/shared';
import { Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { updateSet } from '../api';

export function useToggleVisibility(set: Pick<SetSummary | SetDetail, 'id' | 'visibility'>) {
  const { t } = useTranslation('sets');
  const queryClient = useQueryClient();
  const nextVisibility: Visibility = set.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';

  const mutation = useMutation({
    mutationFn: () => updateSet(set.id, { visibility: nextVisibility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sets'] });
      toast.success(t(nextVisibility === 'PUBLIC' ? 'actions.madePublic' : 'actions.madePrivate'));
    },
    onError: (err) => toast.error(formErrorMessage(err)),
  });

  return {
    nextVisibility,
    toggle: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
}

export function ToggleVisibilityButton({
  set,
}: {
  set: Pick<SetSummary | SetDetail, 'id' | 'visibility'>;
}) {
  const { t } = useTranslation('sets');
  const { nextVisibility, toggle, isPending } = useToggleVisibility(set);
  const isGoingPrivate = nextVisibility === 'PRIVATE';

  return (
    <Button variant="secondary" loading={isPending} onClick={toggle}>
      {isGoingPrivate ? (
        <Lock aria-hidden className="size-4" />
      ) : (
        <Globe aria-hidden className="size-4" />
      )}
      {t(isGoingPrivate ? 'actions.makePrivate' : 'actions.makePublic')}
    </Button>
  );
}
