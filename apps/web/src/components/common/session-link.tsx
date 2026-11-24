'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useSyncExternalStore, type ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { hasSessionMarker } from '@/lib/session-marker';

interface SessionLinkProps {
  guest: { href: Route; label: string };
  member: { href: Route; label: string };
  variant?: ComponentProps<typeof Button>['variant'];
}

const subscribe = () => () => undefined;
const getServerSnapshot = () => false;

/** Trang công khai được cache chung, nên nút theo phiên phải chọn ở trình duyệt. */
export function SessionLink({ guest, member, variant }: SessionLinkProps) {
  const signedIn = useSyncExternalStore(subscribe, hasSessionMarker, getServerSnapshot);
  const { href, label } = signedIn ? member : guest;

  return (
    <Button
      asChild
      variant={variant}
      className="shrink-0 whitespace-nowrap px-2.5 text-small sm:px-4 sm:text-body"
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}
