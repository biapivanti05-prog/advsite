/*
  Warnings:

  - You are about to alter the column `monthsBeforeEnd` on the `TimelinePhase` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `monthsBeforeStart` on the `TimelinePhase` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimelinePhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "order" INTEGER NOT NULL,
    "monthsBeforeStart" REAL NOT NULL,
    "monthsBeforeEnd" REAL NOT NULL,
    CONSTRAINT "TimelinePhase_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TimelinePhase" ("id", "monthsBeforeEnd", "monthsBeforeStart", "name", "order", "weddingId") SELECT "id", "monthsBeforeEnd", "monthsBeforeStart", "name", "order", "weddingId" FROM "TimelinePhase";
DROP TABLE "TimelinePhase";
ALTER TABLE "new_TimelinePhase" RENAME TO "TimelinePhase";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
