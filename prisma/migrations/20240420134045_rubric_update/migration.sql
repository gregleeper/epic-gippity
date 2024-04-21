-- CreateTable
CREATE TABLE "UserRubric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRubric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubricRow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rubricId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "RubricRow_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "UserRubric" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubricColumn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rubricId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "RubricColumn_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "UserRubric" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubricCell" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rowId" INTEGER NOT NULL,
    "columnId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "RubricCell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "RubricRow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RubricCell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "RubricColumn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
