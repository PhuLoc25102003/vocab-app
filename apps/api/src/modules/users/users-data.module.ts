import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';

/** Tách khỏi `UsersModule` để module auth dùng được repository mà không tạo vòng phụ thuộc. */
@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersDataModule {}
