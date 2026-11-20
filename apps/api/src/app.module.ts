import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthCoreModule } from './common/auth/auth-core.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ApiRateLimitGuard } from './common/guards/api-rate-limit.guard';
import { AuthGuard } from './common/guards/auth.guard';
import { OwnershipGuard } from './common/guards/ownership.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { validateEnv } from './config/env';
import { MailModule } from './infrastructure/mail/mail.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CardsModule } from './modules/cards/cards.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { ClassesModule } from './modules/classes/classes.module';
import { FoldersModule } from './modules/folders/folders.module';
import { ImportModule } from './modules/import/import.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SetsModule } from './modules/sets/sets.module';
import { StudyModule } from './modules/study/study.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    MailModule,
    RedisModule,
    AuthCoreModule,
    AuthModule,
    UsersModule,
    SetsModule,
    CardsModule,
    FoldersModule,
    ClassesModule,
    AdminModule,
    ImportModule,
    StudyModule,
    ProgressModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Guard toàn cục chạy theo đúng thứ tự khai báo.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ApiRateLimitGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: OwnershipGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
export class AppModule {}
