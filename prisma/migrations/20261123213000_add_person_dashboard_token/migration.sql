ALTER TABLE "Person" ADD COLUMN "dashboardToken" TEXT;

CREATE UNIQUE INDEX "Person_dashboardToken_key" ON "Person"("dashboardToken");
