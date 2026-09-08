ALTER TABLE "Booking" ADD COLUMN "requestHash" text NOT NULL DEFAULT 'legacy';
ALTER TABLE "Booking" ALTER COLUMN "requestHash" DROP DEFAULT;
