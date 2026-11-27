-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('DAILY', 'ASSIGNMENT_DUE');

-- CreateTable
CREATE TABLE "ReminderLog" (
    "userId" TEXT NOT NULL,
    "kind" "ReminderKind" NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("userId","kind","key")
);

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
