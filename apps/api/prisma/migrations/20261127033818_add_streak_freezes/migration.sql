-- AlterTable
ALTER TABLE "User" ADD COLUMN     "streakFreezeWeek" TEXT,
ADD COLUMN     "streakFreezes" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "StreakFreezeDay" (
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreakFreezeDay_pkey" PRIMARY KEY ("userId","day")
);

-- AddForeignKey
ALTER TABLE "StreakFreezeDay" ADD CONSTRAINT "StreakFreezeDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
