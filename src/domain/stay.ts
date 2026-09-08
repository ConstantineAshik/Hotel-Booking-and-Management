import { z } from "zod";

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date");

export const staySchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate,
  adults: z.number().int().min(1).max(100),
  children: z.number().int().min(0).max(100),
  rooms: z.number().int().min(1).max(100),
}).strict().refine(s => s.adults >= s.rooms, "Each room requires at least one adult")
  .refine(s => s.checkOut > s.checkIn, "Check-out must follow check-in")
  .refine(s => (Date.parse(s.checkOut) - Date.parse(s.checkIn)) / 86_400_000 <= 366, "Stay exceeds maximum supported length");

/** Calendar dates, not instants; check-out never consumes inventory. */
export function stayNights(checkIn: string, checkOut: string): string[] {
  const stay = staySchema.parse({ checkIn, checkOut, adults: 1, children: 0, rooms: 1 });
  const dates: string[] = [];
  for (let time = Date.parse(stay.checkIn); time < Date.parse(stay.checkOut); time += 86_400_000) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  return dates;
}
