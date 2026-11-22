'use client';

import {
  IMAGE_CONTENT_TYPES,
  IMAGE_MAX_BYTES,
  type SetFormInput,
  type SetFormValues,
} from '@vocab/shared';
import { ImagePlus, RefreshCw, Search, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useController, useWatch, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { uploadCardImage } from '@/lib/uploads';
import { ImageSearchDialog } from '@/components/common/image-search-dialog';
import { useTranslation } from 'react-i18next';

interface CardImageFieldProps {
  control: Control<SetFormInput, unknown, SetFormValues>;
  index: number;
  canUpload?: boolean;
  canSearch?: boolean;
  error?: string;
}

function checkFile(file: File): 'image.type' | 'image.tooLarge' | null {
  if (!(IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return 'image.type';
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return 'image.tooLarge';
  }
  return null;
}

/** Ảnh của một thẻ: tìm trực tuyến qua Unsplash / Pixabay hoặc tải lên kho ảnh. */
export function CardImageField({
  control,
  index,
  canUpload = false,
  canSearch = true,
  error,
}: CardImageFieldProps) {
  const { t } = useTranslation('sets');
  const number = index + 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const term = useWatch({ control, name: `cards.${index}.term` });
  const { field } = useController({ control, name: `cards.${index}.imageUrl` });
  const imageUrl = field.value ?? null;
  const message = uploadError ?? error;

  const onSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = checkFile(file);
    setUploadError(problem && t(problem));
    if (problem) return;
    setUploading(true);
    try {
      field.onChange(await uploadCardImage(file));
    } catch (failure) {
      setUploadError(
        failure instanceof HttpError ? formErrorMessage(failure) : t('image.uploadFailed'),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 sm:col-span-2">
      <span className="text-small font-medium">{t('image.label')}</span>

      {canUpload ? (
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_CONTENT_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void onSelect(event)}
        />
      ) : null}

      {imageUrl ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 rounded-xl border border-border/80 bg-surface/50 p-3 shadow-2xs">
          <div className="relative group overflow-hidden rounded-lg border border-border bg-muted/20 shrink-0 w-32 h-24 sm:w-36 sm:h-24 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={t('image.alt', { number })}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canSearch ? (
              <Button
                type="button"
                variant="secondary"
                className="h-9 gap-1.5 border border-border font-medium hover:border-primary/50"
                aria-label={t('image.searchAnotherFor', { number })}
                onClick={() => setSearchOpen(true)}
              >
                <Search aria-hidden className="size-4 text-primary" />
                {t('image.searchAnother')}
              </Button>
            ) : null}

            {canUpload ? (
              <Button
                type="button"
                variant="secondary"
                className="h-9 gap-1.5 border border-border font-medium"
                loading={uploading}
                aria-label={t(canSearch ? 'image.uploadFor' : 'image.changeFor', { number })}
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw aria-hidden className="size-4 text-text-muted" />
                {t(
                  uploading
                    ? 'image.uploading'
                    : canSearch
                      ? 'image.uploadFromDevice'
                      : 'image.change',
                )}
              </Button>
            ) : null}

            {!uploading ? (
              <Button
                type="button"
                variant="secondary"
                className="h-9 gap-1.5 border border-border font-medium text-danger hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
                aria-label={t('image.removeFor', { number })}
                onClick={() => {
                  setUploadError(null);
                  field.onChange(null);
                }}
              >
                <X aria-hidden className="size-4" />
                {t('image.remove')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          {canSearch ? (
            <Button
              type="button"
              variant="secondary"
              className="h-9.5 gap-2 border border-border font-medium shadow-2xs hover:border-primary/60 hover:bg-primary-soft/40"
              aria-label={t('image.searchFor', { number })}
              onClick={() => setSearchOpen(true)}
            >
              <Search aria-hidden className="size-4 text-primary" />
              {t('image.searchOnline')}
            </Button>
          ) : null}

          {canUpload ? (
            <Button
              type="button"
              variant="secondary"
              className="h-9.5 gap-2 border border-border font-medium shadow-2xs hover:border-border-strong"
              loading={uploading}
              aria-label={t(canSearch ? 'image.uploadFor' : 'image.addFor', { number })}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus aria-hidden className="size-4 text-text-muted" />
              {t(uploading ? 'image.uploading' : canSearch ? 'image.uploadFile' : 'image.add')}
            </Button>
          ) : null}
        </div>
      )}

      {message ? (
        <p role="alert" className="text-small text-danger">
          {message}
        </p>
      ) : (
        <p className="text-small text-text-muted">{t('image.rulesWithSearch')}</p>
      )}

      {canSearch ? (
        <ImageSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          initialQuery={term || ''}
          onSelectImage={(url) => {
            setUploadError(null);
            field.onChange(url);
          }}
        />
      ) : null}
    </div>
  );
}
