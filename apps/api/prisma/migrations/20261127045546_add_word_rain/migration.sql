-- CreateEnum
CREATE TYPE "WordRainStyle" AS ENUM ('TYPE', 'SPEAK');

-- AlterEnum
ALTER TYPE "StudyMode" ADD VALUE 'WORD_RAIN';

-- CreateTable
CREATE TABLE "GameHighScore" (
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "style" "WordRainStyle" NOT NULL,
    "score" INTEGER NOT NULL,
    "wave" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameHighScore_pkey" PRIMARY KEY ("userId","setId","style")
);

-- CreateIndex
CREATE INDEX "GameHighScore_setId_idx" ON "GameHighScore"("setId");

-- AddForeignKey
ALTER TABLE "GameHighScore" ADD CONSTRAINT "GameHighScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameHighScore" ADD CONSTRAINT "GameHighScore_setId_fkey" FOREIGN KEY ("setId") REFERENCES "StudySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
