/*
  Warnings:

  - Added the required column `userId` to the `DOK` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DOK" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gradeLevel" TEXT NOT NULL,
    "standards" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "DOK_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DOK" ("createdAt", "gradeLevel", "id", "standards", "updatedAt") SELECT "createdAt", "gradeLevel", "id", "standards", "updatedAt" FROM "DOK";
DROP TABLE "DOK";
ALTER TABLE "new_DOK" RENAME TO "DOK";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
