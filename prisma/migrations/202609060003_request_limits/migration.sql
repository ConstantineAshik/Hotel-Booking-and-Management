CREATE TABLE "RequestLimit" (
  key text PRIMARY KEY,
  count integer NOT NULL,
  "expiresAt" timestamptz NOT NULL
);
CREATE INDEX "RequestLimit_expiresAt_idx" ON "RequestLimit"("expiresAt");
