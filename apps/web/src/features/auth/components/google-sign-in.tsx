'use client';

import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { loginWithGoogle } from '../api';
import { ERROR_CODES } from '@vocab/shared';
import { errorCodeMessage, formErrorMessage } from '@/lib/form-errors';
import {
  getGoogleClientId,
  type GoogleButtonText,
  listenForGoogleCredential,
  loadGoogleIdentity,
  rememberGoogleNext,
  takeGoogleNext,
  usesGoogleRedirect,
} from '../google-identity';
import { safeNextPath } from '../next-path';
import { refreshSession, startSession } from '../session';
import { FormError } from '@/components/common/form-message';
import { useTranslation } from 'react-i18next';
import { toLocale } from '@/lib/i18n/config';
import { HttpError } from '@/lib/http';

/** Nút lớn nhất của Google cao 40 px, phóng lên để đạt vùng bấm 44 px. */
const BUTTON_SCALE = 1.1;
const GOOGLE_MIN_WIDTH = 200;
const GOOGLE_MAX_WIDTH = 400;

function toGoogleWidth(frameWidth: number): number {
  const width = Math.floor(frameWidth / BUTTON_SCALE);
  return Math.min(GOOGLE_MAX_WIDTH, Math.max(GOOGLE_MIN_WIDTH, width));
}

function GoogleButton({ clientId, text }: { clientId: string; text: GoogleButtonText }) {
  const { t, i18n } = useTranslation('auth');
  const locale = toLocale(i18n.language);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const redirectDone = searchParams.get('google') === 'done';
  const redirectError = searchParams.get('google_error');
  const frameRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [submitting, setSubmitting] = useState(redirectDone);
  const [authError, setAuthError] = useState<unknown | null>(null);
  const error = authError
    ? formErrorMessage(authError, locale)
    : redirectError
      ? errorCodeMessage(redirectError, locale)
      : null;

  // Quay về từ chế độ redirect: API đã đặt cookie refresh, chỉ cần lấy phiên rồi đi tiếp.
  useEffect(() => {
    if (!redirectDone || submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    void refreshSession().then((token) => {
      if (token) {
        router.refresh();
        router.replace(safeNextPath(takeGoogleNext()) as Route);
        return;
      }
      submittingRef.current = false;
      setSubmitting(false);
      setAuthError(new HttpError('', 500, ERROR_CODES.INTERNAL_ERROR));
    });
  }, [redirectDone, router]);

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
      setAuthError(null);
      void loginWithGoogle({ credential })
        .then((session) => {
          startSession(session);
          // Prefetch lúc chưa đăng nhập đã bị chuyển về /login, phải bỏ trước khi đi tiếp.
          router.refresh();
          router.replace(safeNextPath(next) as Route);
        })
        .catch((reason: unknown) => setAuthError(reason))
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
        if (usesGoogleRedirect() && !redirectDone) {
          rememberGoogleNext(next);
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
              locale: locale === 'en' ? 'en' : 'vi',
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
  }, [clientId, locale, next, redirectDone, router, text]);

  if (status === 'unavailable') {
    return <p className="text-small text-text-muted">{t('google.failed')}</p>;
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
          {t('google.loading')}
        </p>
      ) : null}
      <div className="flex items-center gap-3 text-small text-text-muted">
        <span aria-hidden className="h-px flex-1 bg-border" />
        {t('google.or')}
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
