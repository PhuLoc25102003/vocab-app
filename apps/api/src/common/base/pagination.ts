import type { Pagination } from '@vocab/shared';

export const ok = <T>(data: T) => ({ data });

export const paginated = <T>(data: T[], total: number, { page, limit }: Pagination) => ({
  data,
  meta: { page, limit, total },
});

export const toSkipTake = ({ page, limit }: Pagination) => ({
  skip: (page - 1) * limit,
  take: limit,
});
