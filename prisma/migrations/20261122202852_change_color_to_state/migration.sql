/*
  Warnings:

  - You are about to drop the column `color` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the `Color` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonColor` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `state` to the `Person` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PersonColor" DROP CONSTRAINT "PersonColor_colorId_fkey";

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "color",
ADD COLUMN     "state" TEXT NOT NULL;

-- DropTable
DROP TABLE "Color";

-- DropTable
DROP TABLE "PersonColor";

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonState" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- AddForeignKey
ALTER TABLE "PersonState" ADD CONSTRAINT "PersonState_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
