-- AlterTable
ALTER TABLE "GameQueue" ADD COLUMN     "filterTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "UserGameTag" (
    "id" TEXT NOT NULL,
    "userGameId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGameTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserGameTag_tag_idx" ON "UserGameTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameTag_userGameId_tag_key" ON "UserGameTag"("userGameId", "tag");

-- AddForeignKey
ALTER TABLE "UserGameTag" ADD CONSTRAINT "UserGameTag_userGameId_fkey" FOREIGN KEY ("userGameId") REFERENCES "UserGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
