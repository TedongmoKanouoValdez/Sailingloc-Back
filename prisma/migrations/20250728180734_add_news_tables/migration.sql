/*
  Warnings:

  - You are about to drop the column `datesIndisponibles` on the `DetailsBateau` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bateau" ADD COLUMN     "datesIndisponibles" TEXT;

-- AlterTable
ALTER TABLE "DetailsBateau" DROP COLUMN "datesIndisponibles";
