import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { emailSchema, roleSchema, type Role } from '@vocab/shared';
import { config as loadEnvFile } from 'dotenv';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { UsersDataModule } from '../modules/users/users-data.module';
import { UsersRepository, type Account } from '../modules/users/users.repository';

const USAGE = 'Cách dùng: npm run user:set-role -w @vocab/api -- <email> <STUDENT|TEACHER|ADMIN>';

export type SetRoleArgs = { ok: true; email: string; role: Role } | { ok: false; message: string };

export function parseSetRoleArgs(argv: readonly string[]): SetRoleArgs {
  const [rawEmail, rawRole, ...rest] = argv;
  if (!rawEmail || !rawRole || rest.length) return { ok: false, message: USAGE };
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) return { ok: false, message: `Email không hợp lệ: ${rawEmail}` };
  const role = roleSchema.safeParse(rawRole.toUpperCase());
  if (!role.success) {
    return {
      ok: false,
      message: `Vai trò phải là STUDENT, TEACHER hoặc ADMIN, nhận được ${rawRole}`,
    };
  }
  return { ok: true, email: email.data, role: role.data };
}

type SetRole = (email: string, role: Role) => Promise<Account | null>;

/** Trả mã thoát và dòng cần in, không in mật khẩu hay token. */
export async function runSetRole(
  argv: readonly string[],
  setRole: SetRole,
): Promise<{ code: number; message: string }> {
  const args = parseSetRoleArgs(argv);
  if (!args.ok) return { code: 1, message: args.message };
  const account = await setRole(args.email, args.role);
  if (!account) {
    return { code: 1, message: `Không có tài khoản ${args.email}. Hãy đăng ký trên web trước.` };
  }
  return {
    code: 0,
    message: `Đã đặt ${account.email} (${account.displayName}) thành ${account.role}. Tải lại trang web để thấy quyền mới.`,
  };
}

/** Chỉ cần database, không cần các biến khác của API như JWT hay CORS. */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsersDataModule],
})
class SetRoleModule {}

async function main(): Promise<void> {
  loadEnvFile({ quiet: true });
  if (!process.env.DATABASE_URL) {
    console.error('Thiếu DATABASE_URL. Đặt trong apps/api/.env hoặc truyền khi chạy lệnh.');
    process.exitCode = 1;
    return;
  }
  const app = await NestFactory.createApplicationContext(SetRoleModule, { logger: ['error'] });
  try {
    const users = app.get(UsersRepository);
    const { code, message } = await runSetRole(process.argv.slice(2), (email, role) =>
      users.setRoleByEmail(email, role),
    );
    (code === 0 ? console.log : console.error)(message);
    process.exitCode = code;
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  void main();
}
