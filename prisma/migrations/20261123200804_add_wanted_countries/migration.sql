-- CreateTable
CREATE TABLE "PersonWantCountry" (
    "personId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "PersonWantCountry_pkey" PRIMARY KEY ("personId", "countryId")
);

-- CreateIndex
CREATE INDEX "PersonWantCountry_countryId_idx" ON "PersonWantCountry"("countryId");

-- AddForeignKey
ALTER TABLE "PersonWantCountry" ADD CONSTRAINT "PersonWantCountry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonWantCountry" ADD CONSTRAINT "PersonWantCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
