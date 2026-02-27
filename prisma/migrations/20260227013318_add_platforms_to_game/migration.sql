-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[];
