import {z} from "zod";
export const pricingTypes=["PER_STAY","PER_NIGHT","PER_PERSON","PER_ROOM"] as const;
export const serviceRulesSchema=z.object({roomTypeIds:z.array(z.uuid()).max(100).default([]),maxQuantity:z.number().int().min(1).max(20).default(10)}).strict();
export const promoRulesSchema=z.object({minimumTotal:z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),minimumNights:z.number().int().min(1).max(366).default(1),roomTypeIds:z.array(z.uuid()).max(100).default([]),ratePlanIds:z.array(z.uuid()).max(100).default([]),newCustomersOnly:z.boolean().default(false)}).strict();
export const bookingOptionsSchema=z.object({services:z.array(z.object({id:z.uuid(),quantity:z.number().int().min(1).max(20)}).strict()).max(30).default([]),promoCode:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{0,40}$/).default("")}).strict().refine(value=>new Set(value.services.map(service=>service.id)).size===value.services.length,"Choose each service once");
export type BookingOptions=z.infer<typeof bookingOptionsSchema>;
export function optionsFromSearch(services:string|undefined,promoCode:string|undefined):BookingOptions{return bookingOptionsSchema.parse({services:(services??"").split(",").filter(Boolean).map(value=>{const [id,quantity]=value.split(":");return{id,quantity:Number(quantity)}}),promoCode:promoCode??""});}
