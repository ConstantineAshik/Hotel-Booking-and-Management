import { z } from "zod";
export const money = z.coerce.number().min(0).max(999999999).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.0001, "Use at most two decimal places");
export const roomSchema = z.object({
  name: z.string().trim().min(2).max(100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().min(10).max(20000), basePrice: money,
  maxAdults: z.coerce.number().int().min(1).max(20), maxChildren: z.coerce.number().int().min(0).max(20),
  maxGuests: z.coerce.number().int().min(1).max(40),
  published: z.boolean(), featured: z.boolean(),
  attributes: z.object({
    shortDescription: z.string().max(300), size: z.coerce.number().min(0).max(5000),
    beds: z.coerce.number().int().min(1).max(20), bedType: z.string().max(100),
    bathrooms: z.coerce.number().int().min(0).max(20), view: z.string().max(100),
    floor: z.string().max(20), smoking: z.boolean(), accessible: z.boolean(),
    breakfast: z.boolean(), videoUrl: z.union([z.literal(""), z.url().startsWith("https://")]),
  }),
}).refine(r => r.maxGuests >= r.maxAdults && r.maxGuests >= r.maxChildren, "Guest capacity must accommodate adult and child limits");
export const unitSchema = z.object({
  roomTypeId: z.uuid(), number: z.string().trim().min(1).max(30),
  status: z.enum(["ACTIVE", "OUT_OF_SERVICE", "RETIRED"]),
  housekeeping: z.enum(["CLEAN", "DIRTY", "CLEANING", "INSPECTED", "MAINTENANCE"]),
  note: z.string().max(2000),
});
export const hotelSchema = z.object({
  name: z.string().trim().min(2).max(100), legalName: z.string().max(150),
  email: z.union([z.literal(""), z.email()]), phone: z.string().max(40), whatsapp: z.string().max(40),
  address: z.string().max(1000), description: z.string().max(3000),
  checkIn: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), checkOut: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().refine(v => { try { Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }),
  currency: z.enum(["USD", "BDT", "EUR", "GBP", "INR", "AED"]),
});
