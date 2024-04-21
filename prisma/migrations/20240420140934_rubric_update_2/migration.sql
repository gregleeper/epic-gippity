/*
  Warnings:

  - Added the required column `gradeLevel` to the `UserRubric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objective` to the `UserRubric` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserRubric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRubric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserRubric" ("createdAt", "description", "id", "name", "public", "userId") SELECT "createdAt", "description", "id", "name", "public", "userId" FROM "UserRubric";
DROP TABLE "UserRubric";
ALTER TABLE "new_UserRubric" RENAME TO "UserRubric";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
