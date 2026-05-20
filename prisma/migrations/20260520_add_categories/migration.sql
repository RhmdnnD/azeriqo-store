-- CreateCategory
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AlterAccount
ALTER TABLE "Account" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Account" DROP COLUMN "name";

CREATE INDEX "Account_categoryId_fkey" ON "Account"("categoryId");
