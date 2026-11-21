'use client';

import {
  IMAGE_CONTENT_TYPES,
  IMAGE_MAX_BYTES,
  type SetFormInput,
  type SetFormValues,
} from '@vocab/shared';
import { ImagePlus, RefreshCw, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useController, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { uploadCardImage } from '../api';
import { useTranslation } from 'react-i18next';

interface CardImageFieldProps {
  control: Control<SetFormInput, unknown, SetFormValues>;
  index: number;
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

/** Ảnh của một thẻ: tải lên kho ảnh ngay khi chọn, form chỉ giữ địa chỉ ảnh. */
export function CardImageField({ control, index, error }: CardImageFieldProps) {
  const { t } = useTranslation('sets');
  const number = index + 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { field } = useController({ control, name: `cards.${index}.imageUrl` });
  const imageUrl = field.value ?? null;
  const message = uploadError ?? error;

  const onSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cho chọn lại đúng tệp vừa chọn sau khi lỗi.
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
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-small font-medium">{t('image.label')}</span>
      <div className="flex flex-wrap items-center gap-3">
        {imageUrl ? (
          // Ảnh nằm ở kho ảnh ngoài, không qua bộ tối ưu ảnh của Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={t('image.alt', { number })}
            className="size-20 rounded-md border border-border bg-bg object-cover"
          />
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_CONTENT_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void onSelect(event)}
        />
        <Button
          variant="secondary"
          loading={uploading}
          aria-label={t(imageUrl ? 'image.changeFor' : 'image.addFor', { number })}
          onClick={() => inputRef.current?.click()}
        >
          {imageUrl ? (
            <RefreshCw aria-hidden className="size-5" />
          ) : (
            <ImagePlus aria-hidden className="size-5" />
          )}
          {t(uploading ? 'image.uploading' : imageUrl ? 'image.change' : 'image.add')}
        </Button>
        {imageUrl && !uploading ? (
          <Button
            variant="ghost"
            aria-label={t('image.removeFor', { number })}
            onClick={() => {
              setUploadError(null);
              field.onChange(null);
            }}
          >
            <X aria-hidden className="size-5" />
            {t('image.remove')}
          </Button>
        ) : null}
      </div>
      {message ? (
        <p role="alert" className="text-small text-danger">
          {message}
        </p>
      ) : (
        <p className="text-small text-text-muted">{t('image.rules')}</p>
      )}
    </div>
  );
}
