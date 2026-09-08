import { test } from "node:test";
import assert from "node:assert/strict";
import { stayNights, staySchema } from "../src/domain/stay.js";
import { authorize, validateDelegation, roleTemplates, type Principal } from "../src/domain/permissions.js";
import { assertBookingTransition } from "../src/domain/booking-state.js";

test("inventory dates exclude checkout and remain stable across DST and leap days", () => {
  assert.deepEqual(stayNights("2028-02-28", "2028-03-01"), ["2028-02-28", "2028-02-29"]);
  assert.deepEqual(stayNights("2027-03-13", "2027-03-15"), ["2027-03-13", "2027-03-14"]);
});
test("invalid and reversed dates and unbounded stays are rejected", () => {
  for (const pair of [["2027-02-29", "2027-03-01"], ["2027-03-01", "2027-03-01"], ["2027-03-02", "2027-03-01"], ["2027-01-01", "2030-01-01"]]) {
    assert.throws(() => stayNights(pair[0], pair[1]));
  }
  assert.equal(staySchema.safeParse({ checkIn: "2027-01-01", checkOut: "2027-01-02", adults: 0, children: 0, rooms: 1 }).success, false);
});
test("authorization denies anonymous, disabled, cross-property and missing grants", () => {
  const user: Principal = { userId: "u", propertyId: "a", permissions: ["booking.view"], disabled: false };
  authorize(user, "a", "booking.view");
  assert.throws(() => authorize(null, "a", "booking.view"));
  assert.throws(() => authorize(user, "b", "booking.view"));
  assert.throws(() => authorize({ ...user, disabled: true }, "a", "booking.view"));
  assert.throws(() => authorize(user, "a", "payments.refund"));
});
test("role editing cannot grant privileges the actor lacks", () => {
  const user: Principal = { userId: "u", propertyId: "a", permissions: ["roles.manage", "booking.view"], disabled: false };
  validateDelegation(user, ["booking.view"]);
  assert.throws(() => validateDelegation(user, ["website.scripts"]));
  assert.equal(roleTemplates.Administrator.includes("website.scripts"), false);
});
test("terminal bookings cannot be resurrected and pending cannot check in", () => {
  assertBookingTransition("PENDING", "CONFIRMED");
  assertBookingTransition("CONFIRMED", "CHECKED_IN");
  assert.throws(() => assertBookingTransition("CANCELLED", "CONFIRMED"));
  assert.throws(() => assertBookingTransition("PENDING", "CHECKED_IN"));
  assert.throws(() => assertBookingTransition("CHECKED_OUT", "CANCELLED"));
});
