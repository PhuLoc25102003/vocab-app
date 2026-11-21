import { Module } from '@nestjs/common';
import { PublicSetCache } from './public-set-cache';

/** Tách riêng để module admin và users xoá cache mà không phụ thuộc cả module sets. */
@Module({
  providers: [PublicSetCache],
  exports: [PublicSetCache],
})
export class PublicSetCacheModule {}
