/*
  Warnings:

  - You are about to drop the column `OptionsPayantes` on the `DetailsBateau` table. All the data in the column will be lost.
  - You are about to drop the column `tarifications` on the `DetailsBateau` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bateau" DROP CONSTRAINT "Bateau_proprietaireId_fkey";

-- AlterTable
ALTER TABLE "Bateau" ALTER COLUMN "proprietaireId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DetailsBateau" DROP COLUMN "OptionsPayantes",
DROP COLUMN "tarifications";

-- AddForeignKey
ALTER TABLE "Bateau" ADD CONSTRAINT "Bateau_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;
