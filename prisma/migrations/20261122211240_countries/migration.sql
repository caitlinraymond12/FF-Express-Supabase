/*
  Warnings:

  - You are about to drop the column `state` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the `PersonState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `State` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PersonState" DROP CONSTRAINT "PersonState_stateId_fkey";

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "state";

-- DropTable
DROP TABLE "PersonState";

-- DropTable
DROP TABLE "State";

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonCountry" (
    "personId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "PersonCountry_pkey" PRIMARY KEY ("personId","countryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE INDEX "PersonCountry_countryId_idx" ON "PersonCountry"("countryId");

-- AddForeignKey
ALTER TABLE "PersonCountry" ADD CONSTRAINT "PersonCountry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonCountry" ADD CONSTRAINT "PersonCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
