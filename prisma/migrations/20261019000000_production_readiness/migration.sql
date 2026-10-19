-- Historical creation times are unknown. Only new modules receive a timestamp.
ALTER TABLE "Module" ADD COLUMN "createdAt" TIMESTAMP(3);
ALTER TABLE "Module" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Module" ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', "moduleName")) STORED;
CREATE INDEX "Module_name_search_idx" ON "Module" USING gin ("searchVector");
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");
CREATE INDEX "Review_moduleId_createdAt_id_idx" ON "Review"("moduleId", "createdAt", "id");
CREATE INDEX "Review_moduleId_semesterTakenId_createdAt_id_idx" ON "Review"("moduleId", "semesterTakenId", "createdAt", "id");
CREATE TABLE "ReviewSubmission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ReviewSubmission_userId_createdAt_idx" ON "ReviewSubmission"("userId", "createdAt");
-- Preserve existing recent submissions when introducing durable limits.
INSERT INTO "ReviewSubmission" (id, "userId", "createdAt") SELECT id, "userId", "createdAt" AT TIME ZONE 'UTC' FROM "Review" WHERE "createdAt" >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - interval '24 hours';
CREATE TABLE "RequestLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "RequestLimit_expiresAt_idx" ON "RequestLimit"("expiresAt");
