import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Không dùng env() vì nó báo lỗi khi thiếu biến, trong khi `prisma generate` không cần DB.
    // Migration cần kết nối trực tiếp, vì pooler của Neon không giữ được khoá của migrate.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
});
