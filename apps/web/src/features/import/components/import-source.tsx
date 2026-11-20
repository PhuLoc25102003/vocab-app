'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  detectDelimiter,
  detectTemplateHeader,
  importPreviewSchema,
  readFirstRecord,
  type DetectedDelimiter,
  type ImportDelimiter,
  type ImportPreviewDto,
  type ImportPreviewInput,
  type ImportPreviewResult,
} from '@vocab/shared';
import { Download, FileUp, SlidersHorizontal } from 'lucide-react';
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type ReactNode,
} from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { SelectField, TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { previewImport } from '../api';
import { IMPORT_FILE_ACCEPT, ImportFileError, readImportFile } from '../read-file';
import { downloadTemplate, type TemplateFormat } from '../template-file';

const DELIMITER_LABELS: Record<ImportDelimiter, string> = {
  auto: 'Tự nhận (nên dùng)',
  tab: 'Phím Tab: dán từ Excel, Google Sheets',
  comma: 'Dấu phẩy: apple, quả táo',
  semicolon: 'Dấu chấm phẩy: apple; quả táo',
  dash: 'Gạch ngang: apple - quả táo',
};

/** Tên ngắn của ký tự đã tự nhận, dùng trong câu "Đã nhận: ...". */
const DETECTED_NAMES: Record<DetectedDelimiter, string> = {
  tab: 'phím Tab',
  comma: 'dấu phẩy',
  semicolon: 'dấu chấm phẩy',
  dash: 'gạch ngang',
};

const DELIMITER_FIELD = 'Từ và nghĩa cách nhau bằng';
const COLUMN_CHOICES = Array.from({ length: 10 }, (_, index) => index + 1);
const SAMPLE_LENGTH = 24;

const shorten = (value: string) =>
  value.length > SAMPLE_LENGTH ? `${value.slice(0, SAMPLE_LENGTH - 1)}…` : value;

/** Ký tự thật dùng để tách và các ô của dòng đầu, để nhãn cột hiện giá trị người dùng nhận ra. */
function readFirstRow(content: string, delimiter: ImportDelimiter) {
  if (!content.trim()) {
    return { detected: null, fields: [] };
  }
  const detected = delimiter === 'auto' ? detectDelimiter(content) : delimiter;
  return { detected, fields: readFirstRecord(content, detected).map((field) => field.trim()) };
}
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
  const [editingOptions, setEditingOptions] = useState(false);
  const preview = useMutation({ mutationFn: previewImport });
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
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

  const content = watch('content');
  const watched = watch('options');
  const options = {
    delimiter: watched?.delimiter ?? 'auto',
    hasHeader: watched?.hasHeader ?? false,
    termColumn: watched?.termColumn ?? 1,
    definitionColumn: watched?.definitionColumn ?? 2,
    phoneticColumn: watched?.phoneticColumn,
    exampleColumn: watched?.exampleColumn,
  };
  const { detected, fields } = readFirstRow(content, options.delimiter);
  const singleColumn = detected !== null && fields.length < 2;
  const optionsOpen = editingOptions || singleColumn || errors.options !== undefined;

  const columnLabel = (column: number) => {
    const sample = fields[column - 1];
    return sample ? `Cột ${column}: ${shorten(sample)}` : `Cột ${column}`;
  };
  const columnSummary = [
    `từ ở cột ${options.termColumn}`,
    `nghĩa ở cột ${options.definitionColumn}`,
    options.phoneticColumn ? `phiên âm ở cột ${options.phoneticColumn}` : null,
    options.exampleColumn ? `ví dụ ở cột ${options.exampleColumn}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const delimiterSummary =
    detected === null
      ? 'Trang tự nhận cách ngăn cách sau khi bạn dán hoặc chọn file.'
      : `Cách nhau bằng ${DETECTED_NAMES[detected]}.`;

  const columnOptions = COLUMN_CHOICES.map((column) => (
    <option key={column} value={column}>
      {columnLabel(column)}
    </option>
  ));
  const optionalColumnOptions = [
    <option key="none" value="">
      Không có
    </option>,
    ...columnOptions,
  ];

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-6">
      {preview.error ? <FormError>{formErrorMessage(preview.error)}</FormError> : null}
      <section aria-labelledby="template-title" className="flex flex-col gap-2">
        <StepTitle id="template-title" step={1}>
          Lấy file mẫu <span className="font-normal text-text-muted">(không bắt buộc)</span>
        </StepTitle>
        <p className="max-w-[65ch] text-text-muted">
          Cột Từ và Nghĩa bắt buộc, cột Phiên âm và Ví dụ có thể để trống. Giữ nguyên hàng tiêu đề
          để trang tự chọn cột.
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
      <section aria-labelledby="source-title" className="flex flex-col gap-2">
        <StepTitle id="source-title" step={2}>
          Đưa danh sách vào
        </StepTitle>
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
          {usesTemplate ? 'Đã nhận ra tiêu đề file mẫu, các cột được chọn sẵn.' : ''}
        </p>
      </section>

      <section aria-labelledby="options-title" className="flex flex-col gap-3">
        <StepTitle id="options-title" step={3}>
          Kiểm tra cách đọc
        </StepTitle>
        {singleColumn ? (
          <FormError>
            Chưa tách được từ và nghĩa. Hãy chọn đúng ký tự ngăn cách từ và nghĩa trong danh sách
            của bạn.
          </FormError>
        ) : null}
        {optionsOpen ? (
          <OptionsFields
            register={register}
            errors={errors}
            delimiterHint={
              options.delimiter === 'auto' && detected !== null
                ? `Đã nhận: ${DETECTED_NAMES[detected]}.`
                : undefined
            }
            columnOptions={columnOptions}
            optionalColumnOptions={optionalColumnOptions}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="max-w-[65ch] text-text-muted" aria-live="polite">
              {delimiterSummary} Lấy {columnSummary}
              {options.hasHeader ? ', bỏ dòng tiêu đề.' : '.'}
            </p>
            <Button type="button" variant="secondary" onClick={() => setEditingOptions(true)}>
              <SlidersHorizontal aria-hidden className="size-4" />
              Đổi cách đọc
            </Button>
          </div>
        )}
      </section>

      <div>
        <Button type="submit" loading={preview.isPending}>
          Xem trước
        </Button>
      </div>
    </form>
  );
}

function StepTitle({ id, step, children }: { id: string; step: number; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-h3">
      <span
        aria-hidden
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-small font-semibold text-primary"
      >
        {step}
      </span>
      <span>
        <span className="sr-only">Bước {step}: </span>
        {children}
      </span>
    </h2>
  );
}

interface OptionsFieldsProps {
  register: UseFormRegister<ImportPreviewInput>;
  errors: FieldErrors<ImportPreviewInput>;
  delimiterHint: string | undefined;
  columnOptions: ReactNode;
  optionalColumnOptions: ReactNode;
}

function OptionsFields({
  register,
  errors,
  delimiterHint,
  columnOptions,
  optionalColumnOptions,
}: OptionsFieldsProps) {
  const headerHintId = useId();
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Cách đọc danh sách</legend>
      <div className="sm:col-span-2">
        <SelectField
          label={DELIMITER_FIELD}
          hint={delimiterHint}
          {...register('options.delimiter')}
        >
          {Object.entries(DELIMITER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
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
      <div className="flex flex-col sm:col-span-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body">
          <input
            type="checkbox"
            className="size-5 shrink-0 accent-primary"
            aria-describedby={headerHintId}
            {...register('options.hasHeader')}
          />
          Dòng đầu là tiêu đề, bỏ qua khi nhập
        </label>
        <p id={headerHintId} className="pl-8 text-small text-text-muted">
          Bật nếu dòng đầu là tên cột như Từ, Nghĩa.
        </p>
      </div>
    </fieldset>
  );
}
