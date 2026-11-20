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

interface CardImageFieldProps {
  control: Control<SetFormInput, unknown, SetFormValues>;
  index: number;
  error?: string;
}

function checkFile(file: File): string | null {
  if (!(IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return 'Chỉ nhận ảnh PNG, JPEG hoặc WebP.';
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return 'Ảnh lớn hơn 1 MB. Hãy chọn ảnh nhỏ hơn hoặc giảm kích thước ảnh.';
  }
  return null;
}

/** Ảnh của một thẻ: tải lên kho ảnh ngay khi chọn, form chỉ giữ địa chỉ ảnh. */
export function CardImageField({ control, index, error }: CardImageFieldProps) {
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
    setUploadError(problem);
    if (problem) return;
    setUploading(true);
    try {
      field.onChange(await uploadCardImage(file));
    } catch (failure) {
      setUploadError(
        failure instanceof HttpError
          ? formErrorMessage(failure)
          : 'Không tải được ảnh lên. Hãy kiểm tra mạng rồi thử lại.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-small font-medium">Ảnh (không bắt buộc)</span>
      <div className="flex flex-wrap items-center gap-3">
        {imageUrl ? (
          // Ảnh nằm ở kho ảnh ngoài, không qua bộ tối ưu ảnh của Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Ảnh của thẻ ${number}`}
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
          aria-label={`${imageUrl ? 'Đổi ảnh' : 'Thêm ảnh'} cho thẻ ${number}`}
          onClick={() => inputRef.current?.click()}
        >
          {imageUrl ? (
            <RefreshCw aria-hidden className="size-5" />
          ) : (
            <ImagePlus aria-hidden className="size-5" />
          )}
          {uploading ? 'Đang tải ảnh' : imageUrl ? 'Đổi ảnh' : 'Thêm ảnh'}
        </Button>
        {imageUrl && !uploading ? (
          <Button
            variant="ghost"
            aria-label={`Gỡ ảnh khỏi thẻ ${number}`}
            onClick={() => {
              setUploadError(null);
              field.onChange(null);
            }}
          >
            <X aria-hidden className="size-5" />
            Gỡ ảnh
          </Button>
        ) : null}
      </div>
      {message ? (
        <p role="alert" className="text-small text-danger">
          {message}
        </p>
      ) : (
        <p className="text-small text-text-muted">PNG, JPEG hoặc WebP, tối đa 1 MB.</p>
      )}
    </div>
  );
}
