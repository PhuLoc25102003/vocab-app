'use client';

import type { ReactNode } from 'react';
import { can, type Action, type OwnedResource } from '../permissions';
import { useAuthStore } from '../store';

interface CanProps {
  action: Action;
  resource?: OwnedResource;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ action, resource, children, fallback = null }: CanProps) {
  const user = useAuthStore((state) => state.user);
  return can(user, action, resource) ? children : fallback;
}
