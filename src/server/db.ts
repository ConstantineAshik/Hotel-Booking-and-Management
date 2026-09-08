import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalDb = globalThis as unknown as { hotelDb?: PrismaClient };
export const db = globalDb.hotelDb ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
if (process.env.NODE_ENV !== "production") globalDb.hotelDb = db;
