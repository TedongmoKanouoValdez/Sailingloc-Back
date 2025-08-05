/*
  Warnings:

  - You are about to drop the column `port` on the `Bateau` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bateau" DROP COLUMN "port",
ADD COLUMN     "typeBateau" TEXT;
