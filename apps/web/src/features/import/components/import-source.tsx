'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  detectTemplateHeader,
  importPreviewSchema,
  type ImportDelimiter,
  type ImportPreviewDto,
  type ImportPreviewInput,
  type ImportPreviewResult,
} from '@vocab/shared';
import { Download, FileUp } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { SelectField, TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { previewImport } from '../api';
import { IMPORT_FILE_ACCEPT, ImportFileError, readImportFile } from '../read-file';
import { downloadTemplate, type TemplateFormat } from '../template-file';

export const DELIMITER_LABELS: Record<ImportDelimiter, string> = {
  auto: 'Tự nhận',
  tab: 'Tab',
  comma: 'Dấu phẩy ( , )',
  semicolon: 'Chấm phẩy ( ; )',
  dash: 'Gạch ngang ( - )',
};

const COLUMN_CHOICES = Array.from({ length: 10 }, (_, index) => index + 1);
const PLACEHOLDER =
  'apple\tquả táo\nbanana\tquả chuối\n\nMỗi dòng một thẻ, từ và nghĩa cách nhau bằng tab, dấu phẩy hoặc " - ".';

const DEFAULT_VALUES: ImportPreviewInput = {
  content: '',
  options: {
    delimiter: 'auto',
    hasHeader: false,
    termColumn: 1,
    definitionColumn: 2,
    phoneticColumn: '',
    exampleColumn: '',
  },
};

/** Cột không bắt buộc người dùng đã chọn, để bảng xem trước hiện đúng ô. */
export interface ImportExtraColumns {
  phonetic: boolean;
  example: boolean;
}

interface ImportSourceProps {
  onPreview: (result: ImportPreviewResult, columns: ImportExtraColumns) => void;
}

export function ImportSource({ onPreview }: ImportSourceProps) {
  const fileInputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [usesTemplate, setUsesTemplate] = useState(false);
  const preview = useMutation({ mutationFn: previewImport });
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ImportPreviewInput, unknown, ImportPreviewDto>({
    resolver: zodResolver(importPreviewSchema),
    defaultValues: DEFAULT_VALUES,
  });

  /** Dòng đầu trùng tiêu đề file mẫu thì chọn sẵn cột, người dùng vẫn đổi lại được. */
  const applyTemplateHeader = (text: string) => {
    const detected = detectTemplateHeader(text);
    setUsesTemplate(Boolean(detected));
    if (!detected) {
      return;
    }
    const options = { shouldDirty: true };
    setValue('options.delimiter', detected.delimiter, options);
    setValue('options.hasHeader', true, options);
    setValue('options.termColumn', detected.termColumn, options);
    setValue('options.definitionColumn', detected.definitionColumn, options);
    setValue('options.phoneticColumn', detected.phoneticColumn ?? '', options);
    setValue('options.exampleColumn', detected.exampleColumn ?? '', options);
  };

  const pasteContent = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!getValues('content').trim()) {
      applyTemplateHeader(event.clipboardData.getData('text'));
    }
  };

  const saveTemplate = async (format: TemplateFormat) => {
    try {
      await downloadTemplate(format);
      setTemplateError(null);
    } catch {
      setTemplateError('Không tạo được file mẫu. Hãy thử lại.');
    }
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const { text, delimiter } = await readImportFile(file);
      setValue('content', text, { shouldDirty: true, shouldValidate: true });
      if (delimiter) {
        setValue('options.delimiter', delimiter, { shouldDirty: true });
      }
      applyTemplateHeader(text);
      setFileName(file.name);
      setFileError(null);
    } catch (error) {
      setFileError(error instanceof ImportFileError ? error.message : 'Không đọc được file.');
    }
  };

  const submit = handleSubmit(async (values) => {
    try {
      const result = await preview.mutateAsync(values);
      onPreview(result, {
        phonetic: values.options.phoneticColumn !== undefined,
        example: values.options.exampleColumn !== undefined,
      });
    } catch {
      // Lỗi hiện qua `preview.error`.
    }
  });

  const columnOptions = COLUMN_CHOICES.map((column) => (
    <option key={column} value={column}>
      Cột {column}
    </option>
  ));
  const optionalColumnOptions = [
    <option key="none" value="">
      Không có
    </option>,
    ...columnOptions,
  ];

  return (
    <form onSubmit={submit} noValidate className="flex max-w-[720px] flex-col gap-6">
      {preview.error ? <FormError>{formErrorMessage(preview.error)}</FormError> : null}
      <section aria-labelledby="template-title" className="flex flex-col gap-2">
        <h2 id="template-title" className="text-h3">
          File mẫu
        </h2>
        <p className="max-w-[65ch] text-text-muted">
          Mỗi dòng là một thẻ. Cột Từ và Nghĩa bắt buộc, cột Phiên âm và Ví dụ có thể để trống. Giữ
          nguyên hàng tiêu đề của file mẫu để trang tự chọn cột.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void saveTemplate('xlsx')}>
            <Download aria-hidden className="size-4" />
            Tải file mẫu .xlsx
          </Button>
          <Button type="button" variant="secondary" onClick={() => void saveTemplate('csv')}>
            <Download aria-hidden className="size-4" />
            Tải file mẫu .csv
          </Button>
        </div>
        {templateError ? <FormError>{templateError}</FormError> : null}
      </section>
      <div className="flex flex-col gap-2">
        <TextareaField
          label="Dán danh sách từ"
          placeholder={PLACEHOLDER}
          rows={8}
          spellCheck={false}
          error={errors.content?.message}
          onPaste={pasteContent}
          {...register('content', {
            onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
              setFileName(null);
              if (!event.target.value.trim()) setUsesTemplate(false);
            },
          })}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            id={fileInputId}
            type="file"
            accept={IMPORT_FILE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-label="Chọn file .txt, .csv hoặc .xlsx"
            onChange={(event) => void chooseFile(event)}
          />
          <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>
            <FileUp aria-hidden className="size-4" />
            Chọn file .txt, .csv hoặc .xlsx
          </Button>
          <p className="text-small text-text-muted wrap-anywhere" aria-live="polite">
            {fileName ? `Đã đọc ${fileName}` : 'Tối đa 2 MB. File Excel chỉ đọc sheet đầu tiên.'}
          </p>
        </div>
        {fileError ? <FormError>{fileError}</FormError> : null}
        <p className="text-small text-text-muted" aria-live="polite">
          {usesTemplate ? 'Đã nhận ra tiêu đề file mẫu, các cột được chọn sẵn bên dưới.' : ''}
        </p>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-h3">Cách đọc</legend>
        <SelectField label="Ký tự phân cách" {...register('options.delimiter')}>
          {Object.entries(DELIMITER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Cột từ" {...register('options.termColumn')}>
          {columnOptions}
        </SelectField>
        <SelectField
          label="Cột nghĩa"
          error={errors.options?.definitionColumn?.message}
          {...register('options.definitionColumn')}
        >
          {columnOptions}
        </SelectField>
        <SelectField
          label="Cột phiên âm (không bắt buộc)"
          error={errors.options?.phoneticColumn?.message}
          {...register('options.phoneticColumn')}
        >
          {optionalColumnOptions}
        </SelectField>
        <SelectField
          label="Cột ví dụ (không bắt buộc)"
          error={errors.options?.exampleColumn?.message}
          {...register('options.exampleColumn')}
        >
          {optionalColumnOptions}
        </SelectField>
        <label className="flex min-h-11 items-center gap-3 text-body sm:col-span-3">
          <input
            type="checkbox"
            className="size-11 shrink-0 accent-primary"
            {...register('options.hasHeader')}
          />
          Dòng đầu là tiêu đề, bỏ qua khi nhập
        </label>
      </fieldset>

      <div>
        <Button type="submit" loading={preview.isPending}>
          Xem trước
        </Button>
      </div>
    </form>
  );
}
