'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signOut } from '../session';

export function LogoutButton() {
  const [leaving, setLeaving] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Đăng xuất"
      title="Đăng xuất"
      loading={leaving}
      onClick={() => {
        setLeaving(true);
        void signOut();
      }}
    >
      <LogOut aria-hidden className="size-5" />
    </Button>
  );
}
