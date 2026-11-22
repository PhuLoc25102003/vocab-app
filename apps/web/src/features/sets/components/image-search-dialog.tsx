'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Loader2, Search, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { searchImages } from '../api';

interface ImageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onSelectImage: (imageUrl: string) => void;
}

interface ImageSearchContentProps {
  initialQuery: string;
  onSelectImage: (imageUrl: string) => void;
  onClose: () => void;
  titleId: string;
  descriptionId: string;
}

function ImageSearchContent({
  initialQuery,
  onSelectImage,
  onClose,
  titleId,
  descriptionId,
}: ImageSearchContentProps) {
  const { t } = useTranslation('sets');
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);

  const {
    data: results,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['image-search', submittedQuery],
    queryFn: () => searchImages(submittedQuery),
    enabled: Boolean(submittedQuery.trim()),
    staleTime: 5 * 60_000,
  });

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (searchTerm.trim()) {
      setSubmittedQuery(searchTerm.trim());
    }
  };

  const handleSelect = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onClose();
  };

  return (
    <div className="flex max-h-[85dvh] flex-col overflow-hidden p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="text-h3 font-semibold">
            {t('image.searchTitle')}
          </h3>
          <p id={descriptionId} className="text-small text-text-muted">
            {t('image.searchDescription')}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label={t('image.closeSearch')} onClick={onClose}>
          <X aria-hidden className="size-5" />
        </Button>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('image.searchPlaceholder')}
            className="h-10 w-full rounded-md border border-border bg-bg px-3 pr-9 text-body text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            autoFocus
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label={t('image.clearSearch')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text"
            >
              <X aria-hidden className="size-4" />
            </button>
          ) : null}
        </div>
        <Button type="submit" variant="primary">
          <Search aria-hidden className="size-4" />
          {t('image.searchButton')}
        </Button>
      </form>

      <div className="mt-4 flex-1 overflow-y-auto overscroll-contain pr-1">
        {isPending && submittedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-muted">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-small">{t('image.searching')}</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-text-muted">
            <p className="text-body font-medium text-danger">{t('image.searchError')}</p>
          </div>
        ) : results && results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {results.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-bg transition hover:border-primary"
              >
                <button
                  type="button"
                  onClick={() => handleSelect(item.imageUrl)}
                  className="relative aspect-square w-full overflow-hidden bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={t('image.selectPhoto', {
                    alt: item.alt,
                    author: item.authorName,
                  })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbUrl}
                    alt={item.alt}
                    loading="lazy"
                    className="size-full object-cover transition duration-200 group-hover:scale-105"
                  />
                </button>
                <div className="flex items-center justify-between gap-1 p-1.5 text-xs text-text-muted">
                  <span className="truncate" title={item.authorName}>
                    {item.authorName}
                  </span>
                  <a
                    href={item.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-0.5 text-text-muted hover:text-text"
                    title={item.source}
                  >
                    <span className="capitalize">{item.source}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-text-muted">
            <p className="text-body font-medium">
              {submittedQuery.trim() ? t('image.noResults') : t('image.enterQueryPrompt')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ImageSearchDialog({
  open,
  onOpenChange,
  initialQuery = '',
  onSelectImage,
}: ImageSearchDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      open={open}
      onRequestClose={() => onOpenChange(false)}
      labelledBy={titleId}
      describedBy={descriptionId}
      layout="sheet"
      size="lg"
    >
      {open ? (
        <ImageSearchContent
          key={initialQuery}
          initialQuery={initialQuery}
          onSelectImage={onSelectImage}
          onClose={() => onOpenChange(false)}
          titleId={titleId}
          descriptionId={descriptionId}
        />
      ) : null}
    </Dialog>
  );
}
