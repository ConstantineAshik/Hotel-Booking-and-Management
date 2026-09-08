import { z } from "zod";
import { money } from "./rooms";

/**
 * Financial catalogue records: taxes & fees, bookable add-on services,
 * and promo codes. Schemas are framework-independent so the booking quote
 * (domain/pricing) and the server actions share one source of truth.
 *
 * Monetary rules are validated at the source: amounts keep at most two
 * decimal places (via `money`); percentage values are bounded to 100.
 */

/** A tax or fee applied to every reservation quote (see availability.ts). */
export const taxSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    kind: z.enum(["FIXED", "PERCENT"]),
    value: money,
    included: z.boolean().default(false),
    priority: z.coerce.number().int().min(0).max(1000).default(0),
    active: z.boolean().default(true),
  })
  .superRefine((tax, ctx) => {
    if (tax.kind === "PERCENT" && tax.value > 100) {
      ctx.addIssue({ code: "custom", message: "Percentage taxes cannot exceed 100%." });
    }
  });
export type TaxInput = z.infer<typeof taxSchema>;

/** A bookable add-on such as airport transfer or a spa visit. */
export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).default(""),
  price: money,
  pricingType: z.enum(["PER_STAY", "PER_NIGHT", "PER_PERSON", "PER_ROOM"]).default("PER_STAY"),
  active: z.boolean().default(true),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

/** Eligibility rules for a promo code. Kept in JSON on the row. */
export const promoRulesSchema = z.object({
  minBookingAmount: z.number().min(0).max(999999999).nullable().default(null),
  minNights: z.number().int().min(1).max(366).nullable().default(null),
  roomTypeIds: z.array(z.uuid()).max(100).default([]),
  newCustomersOnly: z.boolean().default(false),
});

/** A promotional code a guest can apply at checkout. */
export const promoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{2,40}$/, "Use 2–40 letters, numbers, underscores or dashes."),
    kind: z.enum(["PERCENT", "FIXED"]),
    value: money,
    startsAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    usageLimit: z.coerce.number().int().min(1).max(1_000_000).nullish().transform(v => v ?? null),
    perGuestLimit: z.coerce.number().int().min(1).max(1000).default(1),
    rules: promoRulesSchema.default({
      minBookingAmount: null,
      minNights: null,
      roomTypeIds: [],
      newCustomersOnly: false,
    }),
    active: z.boolean().default(true),
  })
  .superRefine((promo, ctx) => {
    if (promo.kind === "PERCENT" && promo.value > 100) {
      ctx.addIssue({ code: "custom", message: "Percentage discounts cannot exceed 100%." });
    }
    if (promo.expiresAt <= promo.startsAt) {
      ctx.addIssue({ code: "custom", message: "Promotion must end after it begins." });
    }
  });
export type PromoInput = z.infer<typeof promoSchema>;
