/*
  Warnings:

  - You are about to drop the column `typeAssurance` on the `Assurance` table. All the data in the column will be lost.
  - You are about to drop the column `datesIndisponibles` on the `Bateau` table. All the data in the column will be lost.
  - You are about to drop the column `disponibilite` on the `Bateau` table. All the data in the column will be lost.
  - You are about to drop the column `port` on the `Bateau` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Contrat` table. All the data in the column will be lost.
  - You are about to drop the column `montant` on the `Contrat` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `DetailsBateau` table. All the data in the column will be lost.
  - You are about to drop the column `portdarriver` on the `DetailsBateau` table. All the data in the column will be lost.
  - You are about to drop the column `portdedepart` on the `DetailsBateau` table. All the data in the column will be lost.
  - You are about to drop the `CoordonneesBancaires` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[recuId]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `couvertureAssurance` to the `Assurance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Contrat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `DemandeProprietaire` table without a default value. This is not possible if the table is not empty.
  - Added the required column `etatPaiement` to the `Paiement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montantTotal` to the `Paiement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pourcentageStripe` to the `Paiement` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `methodePaiement` on the `Paiement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EtatPaiement" AS ENUM ('PAYE', 'EN_ATTENTE', 'ECHEC');

-- DropForeignKey
ALTER TABLE "CoordonneesBancaires" DROP CONSTRAINT "CoordonneesBancaires_utilisateurId_fkey";

-- AlterTable
ALTER TABLE "Assurance" DROP COLUMN "typeAssurance",
ADD COLUMN     "couvertureAssurance" "TypeAssurance" NOT NULL;

-- AlterTable
ALTER TABLE "Bateau" DROP COLUMN "datesIndisponibles",
DROP COLUMN "disponibilite",
DROP COLUMN "port",
ADD COLUMN     "portdefault" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contrat" DROP COLUMN "date",
DROP COLUMN "montant",
ADD COLUMN     "signature" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "DemandeProprietaire" ADD COLUMN     "data" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DetailsBateau" DROP COLUMN "contact",
DROP COLUMN "portdarriver",
DROP COLUMN "portdedepart",
ADD COLUMN     "anneeConstruction" TEXT,
ADD COLUMN     "portArriver" TEXT,
ADD COLUMN     "portDeplacement" TEXT,
ADD COLUMN     "tarifications" TEXT;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "recuId" INTEGER;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "lu" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Paiement" ADD COLUMN     "etatPaiement" "EtatPaiement" NOT NULL,
ADD COLUMN     "montantTotal" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "pourcentageStripe" DECIMAL(65,30) NOT NULL,
DROP COLUMN "methodePaiement",
ADD COLUMN     "methodePaiement" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Proprietaire" ADD COLUMN     "contact" TEXT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "urlDocumentContrat" TEXT;

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "dernierAcces" TIMESTAMP(3),
ADD COLUMN     "photoProfil" TEXT,
ADD COLUMN     "telephone" TEXT;

-- DropTable
DROP TABLE "CoordonneesBancaires";

-- CreateTable
CREATE TABLE "Recu" (
    "id" SERIAL NOT NULL,
    "paiementId" INTEGER NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commentaire" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" INTEGER NOT NULL,
    "bateauId" INTEGER,
    "reservationId" INTEGER,

    CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recu_paiementId_key" ON "Recu"("paiementId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_recuId_key" ON "Media"("recuId");

-- AddForeignKey
ALTER TABLE "Recu" ADD CONSTRAINT "Recu_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "Paiement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_bateauId_fkey" FOREIGN KEY ("bateauId") REFERENCES "Bateau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_recuId_fkey" FOREIGN KEY ("recuId") REFERENCES "Recu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
