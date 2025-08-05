/*
  Warnings:

  - A unique constraint covering the columns `[contratId]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bateau" ADD COLUMN     "datesIndisponibles" TEXT,
ALTER COLUMN "disponibilite" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "contratId" INTEGER;

-- CreateTable
CREATE TABLE "DetailsBateau" (
    "id" SERIAL NOT NULL,
    "longueur" DOUBLE PRECISION,
    "largeur" DOUBLE PRECISION,
    "tirantEau" DOUBLE PRECISION,
    "capaciteMax" INTEGER,
    "nombreCabines" INTEGER,
    "nombreCouchages" INTEGER,
    "equipements" TEXT,
    "optionsPayantes" TEXT,
    "zonesNavigation" TEXT,
    "politiqueAnnulation" TEXT,
    "locationSansPermis" BOOLEAN,
    "numeroPoliceAssurance" TEXT,
    "certificatNavigation" TEXT,
    "contact" TEXT,
    "OptionsPayantes" TEXT,
    "tarifications" TEXT,
    "bateauId" INTEGER NOT NULL,

    CONSTRAINT "DetailsBateau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoordonneesBancaires" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "titulaire" TEXT NOT NULL,
    "numeroCarte" TEXT NOT NULL,
    "dateExpiration" TIMESTAMP(3) NOT NULL,
    "codeCVV" TEXT NOT NULL,
    "banque" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordonneesBancaires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DetailsBateau_bateauId_key" ON "DetailsBateau"("bateauId");

-- CreateIndex
CREATE UNIQUE INDEX "CoordonneesBancaires_utilisateurId_key" ON "CoordonneesBancaires"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_contratId_key" ON "Reservation"("contratId");

-- AddForeignKey
ALTER TABLE "DetailsBateau" ADD CONSTRAINT "DetailsBateau_bateauId_fkey" FOREIGN KEY ("bateauId") REFERENCES "Bateau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordonneesBancaires" ADD CONSTRAINT "CoordonneesBancaires_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
