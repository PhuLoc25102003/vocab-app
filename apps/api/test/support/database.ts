import type { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { isTestDatabaseName } from './database-url.mjs';

export async function currentDatabaseName(prisma: PrismaService): Promise<string> {
  const [row] = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  if (!row) {
    throw new Error('Không đọc được tên database hiện tại');
  }
  return row.name;
}

/** Xoá dữ liệu mọi bảng. Từ chối chạy nếu không phải database test. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const name = await currentDatabaseName(prisma);
  if (!isTestDatabaseName(name)) {
    throw new Error(`Từ chối xoá dữ liệu của database ${name}`);
  }

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length > 0) {
    const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE`);
  }
}
