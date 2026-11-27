import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SkipApiRateLimit } from '../../common/decorators/skip-api-rate-limit.decorator';
import { JOB_SECRET_HEADER, JobSecretGuard } from '../../common/guards/job-secret.guard';
import { RemindersService } from './reminders.service';

/** Endpoint cho GitHub Actions gọi theo lịch, xác thực bằng `X-Job-Secret` thay cho đăng nhập. */
@ApiTags('jobs')
@ApiHeader({ name: JOB_SECRET_HEADER, required: true })
@Public()
@SkipApiRateLimit()
@UseGuards(JobSecretGuard)
@Controller('internal/jobs')
export class JobsController {
  constructor(private readonly reminders: RemindersService) {}

  @Post('daily-reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nhắc giữ chuỗi, ôn thẻ đến hạn và bài tập sắp hết hạn' })
  dailyReminders() {
    return this.reminders.runDaily();
  }
}
