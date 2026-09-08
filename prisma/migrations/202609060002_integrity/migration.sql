ALTER TABLE "InventoryNight" ADD CONSTRAINT "inventory_exactly_one_owner"
  CHECK (num_nonnulls("bookingRoomId", "blockId") = 1);
ALTER TABLE "RoomType" ADD CONSTRAINT "room_positive_values" CHECK (
  "basePrice" >= 0 AND "maxAdults" > 0 AND "maxChildren" >= 0 AND "maxGuests" > 0
);
ALTER TABLE "RatePlan" ADD CONSTRAINT "rate_valid_values" CHECK (
  "basePrice" >= 0 AND "minStay" > 0 AND "maxStay" >= "minStay"
);
ALTER TABLE "BookingRoom" ADD CONSTRAINT "booking_room_valid_stay" CHECK (
  "checkOut" > "checkIn" AND "checkOut" - "checkIn" <= 366 AND "adults" > 0 AND "children" >= 0
);
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "block_valid_dates" CHECK ("end" > "start");
ALTER TABLE "RateOverride" ADD CONSTRAINT "override_valid_values" CHECK (
  "end" > "start" AND "adjustment" IN ('FIXED', 'PERCENT', 'REPLACE')
);
ALTER TABLE "Booking" ADD CONSTRAINT "booking_nonnegative_total" CHECK ("total" >= 0);
ALTER TABLE "Payment" ADD CONSTRAINT "payment_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "Refund" ADD CONSTRAINT "refund_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "Service" ADD CONSTRAINT "service_valid_price" CHECK (
  "price" >= 0 AND "pricingType" IN ('PER_STAY', 'PER_NIGHT', 'PER_PERSON', 'PER_ROOM')
);
ALTER TABLE "BookingService" ADD CONSTRAINT "booking_service_valid_values" CHECK ("quantity" > 0 AND "total" >= 0);
ALTER TABLE "PromoCode" ADD CONSTRAINT "promo_valid_values" CHECK (
  "expiresAt" > "startsAt" AND "value" >= 0 AND "perGuestLimit" > 0
  AND ("usageLimit" IS NULL OR "usageLimit" > 0)
  AND "kind" IN ('PERCENT', 'FIXED', 'FREE_SERVICE')
  AND ("kind" <> 'PERCENT' OR "value" <= 100)
);
ALTER TABLE "TaxRule" ADD CONSTRAINT "tax_valid_values" CHECK ("value" >= 0 AND "kind" IN ('PERCENT', 'FIXED'));
ALTER TABLE "Media" ADD CONSTRAINT "media_valid_size" CHECK ("bytes" > 0);
ALTER TABLE "User" ADD CONSTRAINT "user_email_normalized" CHECK ("email" = lower(trim("email")));
ALTER TABLE "PromoCode" ADD CONSTRAINT "promo_code_normalized" CHECK ("code" = upper(trim("code")));

-- Prevent allocations to a unit of the wrong type, property, or date range even
-- if a future caller bypasses application validation. Unique PK serializes races.
CREATE FUNCTION validate_inventory_night() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  valid boolean;
BEGIN
  IF NEW."bookingRoomId" IS NOT NULL THEN
    SELECT true INTO valid
    FROM "BookingRoom" br
    JOIN "RatePlan" rp ON rp.id = br."ratePlanId"
    JOIN "RoomUnit" ru ON ru.id = NEW."unitId" AND ru."roomTypeId" = rp."roomTypeId"
    JOIN "Booking" b ON b.id = br."bookingId"
    WHERE br.id = NEW."bookingRoomId" AND NEW.date >= br."checkIn" AND NEW.date < br."checkOut"
      AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN') AND ru.status = 'ACTIVE';
  ELSE
    SELECT true INTO valid FROM "AvailabilityBlock" ab
    WHERE ab.id = NEW."blockId" AND NEW.date >= ab.start AND NEW.date < ab."end" AND ab."releasedAt" IS NULL;
  END IF;
  IF valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Invalid inventory allocation' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER inventory_validate BEFORE INSERT OR UPDATE ON "InventoryNight"
FOR EACH ROW EXECUTE FUNCTION validate_inventory_night();

-- Changing a stay or terminal status must release/reallocate its ledger within
-- the same transaction. Deferred checks permit legitimate atomic rescheduling.
CREATE FUNCTION validate_booking_ledger() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE invalid boolean; target_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'Booking' THEN target_id := NEW.id;
  ELSE target_id := NEW."bookingId";
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM "InventoryNight" n
    JOIN "BookingRoom" br ON br.id = n."bookingRoomId"
    JOIN "Booking" b ON b.id = br."bookingId"
    JOIN "RatePlan" rp ON rp.id = br."ratePlanId"
    JOIN "RoomUnit" ru ON ru.id = n."unitId"
    WHERE b.id = target_id
      AND (n.date < br."checkIn" OR n.date >= br."checkOut"
        OR rp."roomTypeId" <> ru."roomTypeId"
        OR b.status NOT IN ('PENDING', 'CONFIRMED', 'CHECKED_IN'))
  ) INTO invalid;
  IF invalid THEN RAISE EXCEPTION 'Booking ledger must be released or reallocated' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER booking_ledger_check AFTER UPDATE ON "Booking"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_booking_ledger();
CREATE CONSTRAINT TRIGGER booking_room_ledger_check AFTER UPDATE ON "BookingRoom"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_booking_ledger();
