import {z} from "zod";
export const guestProfileSchema=z.object({nationality:z.string().trim().max(100).default(""),address:z.string().trim().max(1000).default(""),preferences:z.string().trim().max(3000).default("")}).strict();
export const guestInputSchema=z.object({id:z.uuid(),name:z.string().trim().min(2).max(150),email:z.email().max(254).transform(value=>value.toLowerCase()),phone:z.string().trim().max(40),notes:z.string().trim().max(5000),vip:z.boolean(),blacklisted:z.boolean(),profile:guestProfileSchema,fingerprint:z.string().length(64)}).strict();
