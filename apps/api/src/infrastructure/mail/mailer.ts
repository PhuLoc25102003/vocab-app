import { Injectable, Logger } from '@nestjs/common';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Cổng gửi thư. Bản dùng được chọn trong `MailModule` theo biến môi trường. */
export abstract class Mailer {
  abstract send(message: MailMessage): Promise<void>;
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_TIMEOUT_MS = 10_000;

export class BrevoMailer extends Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {
    super();
  }

  async send({ to, subject, text, html }: MailMessage): Promise<void> {
    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { email: this.from, name: 'Nhớ Từ' },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Brevo trả ${response.status}`);
    }
  }
}

const KEPT_MESSAGES = 20;

/**
 * Dùng khi chưa cấu hình Brevo: không gửi, chỉ ghi log không kèm nội dung (liên kết có token),
 * giữ vài thư gần nhất trong bộ nhớ để test và E2E đọc được.
 */
@Injectable()
export class InMemoryMailer extends Mailer {
  private readonly logger = new Logger('Mailer');
  readonly sent: MailMessage[] = [];

  send(message: MailMessage): Promise<void> {
    this.logger.warn(`Chưa cấu hình gửi thư, bỏ qua thư "${message.subject}"`);
    this.sent.push(message);
    if (this.sent.length > KEPT_MESSAGES) this.sent.shift();
    return Promise.resolve();
  }
}
