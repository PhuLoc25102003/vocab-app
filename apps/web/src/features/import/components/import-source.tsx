'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  detectDelimiter,
  detectTemplateHeader,
  importPreviewSchema,
  readFirstRecord,
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
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { SelectField, TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { previewImport } from '../api';
import { IMPORT_FILE_ACCEPT, ImportFileError, readImportFile } from '../read-file';
import { downloadTemplate } from '../template-file';
import { useTranslation } from 'react-i18next';

const DELIMITERS: readonly ImportDelimiter[] = ['auto', 'tab', 'comma', 'semicolon', 'dash'];
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
  const { t } = useTranslation('sets');
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
    control,
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

  const saveTemplate = async () => {
    try {
      await downloadTemplate();
      setTemplateError(null);
    } catch {
      setTemplateError(t('import.templateFailed'));
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
      setFileError(
        error instanceof ImportFileError ? t(`import.file.${error.code}`) : t('import.readFailed'),
      );
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

  const content = useWatch({ control, name: 'content' });
  const watched = useWatch({ control, name: 'options' });
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
    return sample
      ? t('import.columnSample', { column, sample: shorten(sample) })
      : t('import.column', { column });
  };
  const columnSummary = [
    t('import.summary.term', { column: options.termColumn }),
    t('import.summary.definition', { column: options.definitionColumn }),
    options.phoneticColumn
      ? t('import.summary.phonetic', { column: options.phoneticColumn })
      : null,
    options.exampleColumn ? t('import.summary.example', { column: options.exampleColumn }) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const delimiterSummary =
    detected === null
      ? t('import.autoDetectLater')
      : t('import.separatedBy', { name: t(`import.detected.${detected}`) });

  const columnOptions = COLUMN_CHOICES.map((column) => (
    <option key={column} value={column}>
      {columnLabel(column)}
    </option>
  ));
  const optionalColumnOptions = [
    <option key="none" value="">
      {t('import.noColumn')}
    </option>,
    ...columnOptions,
  ];

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-6">
      {preview.error ? <FormError>{formErrorMessage(preview.error)}</FormError> : null}
      <section aria-labelledby="template-title" className="flex flex-col gap-2">
        <StepTitle id="template-title" step={1}>
          {t('import.templateTitle')}{' '}
          <span className="font-normal text-text-muted">{t('import.optional')}</span>
        </StepTitle>
        <p className="max-w-[65ch] text-text-muted">
          {t('import.templateText1')}
          {t('import.templateText2')}
        </p>
        <div>
          <Button type="button" variant="secondary" onClick={() => void saveTemplate()}>
            <Download aria-hidden className="size-4" />
            {t('import.templateDownload')}
          </Button>
        </div>
        {templateError ? <FormError>{templateError}</FormError> : null}
      </section>
      <section aria-labelledby="source-title" className="flex flex-col gap-2">
        <StepTitle id="source-title" step={2}>
          {t('import.sourceTitle')}
        </StepTitle>
        <TextareaField
          label={t('import.paste')}
          placeholder={t('import.placeholder')}
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
            aria-label={t('import.chooseFile')}
            onChange={(event) => void chooseFile(event)}
          />
          <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>
            <FileUp aria-hidden className="size-4" />
            {t('import.chooseFile')}
          </Button>
          <p className="text-small text-text-muted wrap-anywhere" aria-live="polite">
            {fileName ? t('import.fileRead', { name: fileName }) : t('import.fileLimit')}
          </p>
        </div>
        {fileError ? <FormError>{fileError}</FormError> : null}
        <p className="text-small text-text-muted" aria-live="polite">
          {usesTemplate ? t('import.templateDetected') : ''}
        </p>
      </section>

      <section aria-labelledby="options-title" className="flex flex-col gap-3">
        <StepTitle id="options-title" step={3}>
          {t('import.optionsTitle')}
        </StepTitle>
        {singleColumn ? <FormError>{t('import.singleColumn')}</FormError> : null}
        {optionsOpen ? (
          <OptionsFields
            register={register}
            errors={errors}
            delimiterHint={
              options.delimiter === 'auto' && detected !== null
                ? t('import.detectedHint', { name: t(`import.detected.${detected}`) })
                : undefined
            }
            columnOptions={columnOptions}
            optionalColumnOptions={optionalColumnOptions}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="max-w-[65ch] text-text-muted" aria-live="polite">
              {delimiterSummary} {t('import.takeColumns', { columns: columnSummary })}
              {options.hasHeader ? t('import.skipHeader') : '.'}
            </p>
            <Button type="button" variant="secondary" onClick={() => setEditingOptions(true)}>
              <SlidersHorizontal aria-hidden className="size-4" />
              {t('import.changeOptions')}
            </Button>
          </div>
        )}
      </section>

      <div>
        <Button type="submit" loading={preview.isPending}>
          {t('import.previewTitle')}
        </Button>
      </div>
    </form>
  );
}

function StepTitle({ id, step, children }: { id: string; step: number; children: ReactNode }) {
  const { t } = useTranslation('sets');
  return (
    <h2 id={id} className="flex items-center gap-3 text-h3">
      <span
        aria-hidden
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-small font-semibold text-primary"
      >
        {step}
      </span>
      <span>
        <span className="sr-only">{t('import.step', { step })}</span>
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
  const { t } = useTranslation('sets');
  const headerHintId = useId();
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">{t('import.optionsLegend')}</legend>
      <div className="sm:col-span-2">
        <SelectField
          label={t('import.delimiterField')}
          hint={delimiterHint}
          {...register('options.delimiter')}
        >
          {DELIMITERS.map((value) => (
            <option key={value} value={value}>
              {t(`import.delimiters.${value}`)}
            </option>
          ))}
        </SelectField>
      </div>
      <SelectField label={t('import.termColumn')} {...register('options.termColumn')}>
        {columnOptions}
      </SelectField>
      <SelectField
        label={t('import.definitionColumn')}
        error={errors.options?.definitionColumn?.message}
        {...register('options.definitionColumn')}
      >
        {columnOptions}
      </SelectField>
      <SelectField
        label={t('import.phoneticColumn')}
        error={errors.options?.phoneticColumn?.message}
        {...register('options.phoneticColumn')}
      >
        {optionalColumnOptions}
      </SelectField>
      <SelectField
        label={t('import.exampleColumn')}
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
          {t('import.hasHeader')}
        </label>
        <p id={headerHintId} className="pl-8 text-small text-text-muted">
          {t('import.hasHeaderHint')}
        </p>
      </div>
    </fieldset>
  );
}
