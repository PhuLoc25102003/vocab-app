'use client';

import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { loginWithGoogle } from '../api';
import { formErrorMessage } from '@/lib/form-errors';
import {
  getGoogleClientId,
  type GoogleButtonText,
  listenForGoogleCredential,
  loadGoogleIdentity,
} from '../google-identity';
import { safeNextPath } from '../next-path';
import { startSession } from '../session';
import { FormError } from '@/components/common/form-message';

/** Nút lớn nhất của Google cao 40 px, phóng lên để đạt vùng bấm 44 px. */
const BUTTON_SCALE = 1.1;
const GOOGLE_MIN_WIDTH = 200;
const GOOGLE_MAX_WIDTH = 400;

function toGoogleWidth(frameWidth: number): number {
  const width = Math.floor(frameWidth / BUTTON_SCALE);
  return Math.min(GOOGLE_MAX_WIDTH, Math.max(GOOGLE_MIN_WIDTH, width));
}

function GoogleButton({ clientId, text }: { clientId: string; text: GoogleButtonText }) {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const frameRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const slot = slotRef.current;
    if (!frame || !slot) {
      return;
    }

    let active = true;
    let observer: ResizeObserver | null = null;
    let renderedWidth = 0;

    const stopListening = listenForGoogleCredential((credential) => {
      if (submittingRef.current) {
        return;
      }
      submittingRef.current = true;
      setSubmitting(true);
      setError(null);
      void loginWithGoogle({ credential })
        .then((session) => {
          startSession(session);
          // Prefetch lúc chưa đăng nhập đã bị chuyển về /login, phải bỏ trước khi đi tiếp.
          router.refresh();
          router.replace(safeNextPath(next) as Route);
        })
        .catch((reason: unknown) => setError(formErrorMessage(reason)))
        .finally(() => {
          submittingRef.current = false;
          setSubmitting(false);
        });
    });

    loadGoogleIdentity(clientId)
      .then((google) => {
        if (!active) {
          return;
        }
        observer = new ResizeObserver(([entry]) => {
          const width = toGoogleWidth(entry?.contentRect.width ?? 0);
          if (width !== renderedWidth) {
            renderedWidth = width;
            google.renderButton(slot, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text,
              shape: 'rectangular',
              logo_alignment: 'center',
              locale: 'vi',
              width,
            });
            setStatus('ready');
          }
        });
        observer.observe(frame);
      })
      .catch(() => {
        if (active) {
          setStatus('unavailable');
        }
      });

    return () => {
      active = false;
      observer?.disconnect();
      stopListening();
    };
  }, [clientId, next, router, text]);

  if (status === 'unavailable') {
    return (
      <p className="text-small text-text-muted">
        Chưa tải được đăng nhập Google. Bạn vẫn có thể dùng email và mật khẩu.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <FormError>{error}</FormError> : null}
      <div ref={frameRef} aria-busy={submitting} className="relative h-11 w-full">
        {status === 'loading' ? <Skeleton className="absolute inset-0" /> : null}
        <div
          ref={slotRef}
          inert={submitting}
          // Iframe của Google có nền trong suốt chỉ khi cùng color-scheme với nó.
          className={`w-fit origin-top-left scale-110 scheme-light ${submitting ? 'opacity-50' : ''}`}
        />
      </div>
      {submitting ? (
        <p role="status" className="text-small text-text-muted">
          Đang đăng nhập bằng Google...
        </p>
      ) : null}
      <div className="flex items-center gap-3 text-small text-text-muted">
        <span aria-hidden className="h-px flex-1 bg-border" />
        hoặc
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

/** Chữ trên nút do Google dịch, chọn loại ngắn để vừa màn hình 360 px. */
export function GoogleSignIn({ text }: { text: GoogleButtonText }) {
  const clientId = getGoogleClientId();
  return clientId ? <GoogleButton clientId={clientId} text={text} /> : null;
}
