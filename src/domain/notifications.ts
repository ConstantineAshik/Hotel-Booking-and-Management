import {z} from "zod";
export const notificationKeys=["booking.confirmation","payment.receipt"] as const;
export const notificationLabels:Record<typeof notificationKeys[number],string>={"booking.confirmation":"Booking confirmation","payment.receipt":"Payment receipt"};
export const notificationVariables=["guest_name","booking_id","hotel_name","checkin_date","checkout_date","amount","booking_status"] as const;
export function validPlaceholders(text:string){return [...text.matchAll(/\{\{([^{}]*)\}\}/g)].every(match=>notificationVariables.includes(match[1] as typeof notificationVariables[number]))&&!text.replace(/\{\{[^{}]*\}\}/g,"").includes("{{");}
export const notificationTemplateSchema=z.object({key:z.enum(notificationKeys),locale:z.enum(["en","bn","ar","hi"]),subject:z.string().trim().min(1).max(200).refine(v=>!/[\r\n]/.test(v),"Subject must be one line").refine(validPlaceholders,"Use only the listed placeholders"),body:z.string().trim().min(1).max(20000).refine(validPlaceholders,"Use only the listed placeholders"),active:z.boolean()}).strict();
export const defaultNotificationTemplates={
 "booking.confirmation":{subject:"Your reservation at {{hotel_name}} · {{booking_id}}",body:"Hello {{guest_name}},\n\nYour reservation {{booking_id}} at {{hotel_name}} is {{booking_status}}.\nArrival: {{checkin_date}}\nDeparture: {{checkout_date}}\nReservation total: {{amount}}\n\nPlease contact the hotel if you need help with your stay."},
 "payment.receipt":{subject:"Payment received · {{booking_id}}",body:"Hello {{guest_name}},\n\nWe have recorded your payment of {{amount}} for reservation {{booking_id}} at {{hotel_name}}.\n\nThank you."}
};
export function renderNotification(text:string,variables:Record<string,string>){return text.replace(/\{\{([a-z_]+)\}\}/g,(_,key:string)=>variables[key]??"");}
