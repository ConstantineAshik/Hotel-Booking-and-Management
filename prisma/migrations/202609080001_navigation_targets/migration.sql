ALTER TABLE "MenuItem" ADD COLUMN "linkType" TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE "MenuItem" ADD COLUMN "pageId" UUID;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "MenuItem_pageId_idx" ON "MenuItem"("pageId");