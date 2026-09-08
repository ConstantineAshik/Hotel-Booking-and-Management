import {z} from "zod";
import {imageId,safeUrl} from "./cms";

export const contentKinds=["offers","packages","testimonials","faq","gallery","nearby","blog","events"] as const;
export const contentLabels:Record<typeof contentKinds[number],string>={offers:"Offers",packages:"Packages",testimonials:"Guest testimonials",faq:"Frequently asked questions",gallery:"Gallery",nearby:"Nearby places",blog:"Journal",events:"Events"};
export const contentDocumentSchema=z.object({
 title:z.string().trim().min(2).max(200),body:z.string().trim().max(30000).default(""),
 imageId,url:safeUrl.default(""),buttonLabel:z.string().max(80).default(""),
 author:z.string().max(150).default(""),category:z.string().max(100).default(""),
 startsAt:z.string().datetime().nullable().default(null),endsAt:z.string().datetime().nullable().default(null),
 seoTitle:z.string().max(200).default(""),description:z.string().max(500).default("")
}).strict().refine(value=>!value.startsAt||!value.endsAt||value.endsAt>value.startsAt,"End must follow start");
export type ContentDocument=z.infer<typeof contentDocumentSchema>;
export const contentInputSchema=z.object({id:z.uuid().optional(),version:z.number().int().min(0),kind:z.enum(contentKinds),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),locale:z.enum(["en","bn","ar","hi"]),document:contentDocumentSchema,mode:z.enum(["draft","publish","archive"])}).strict();
export function contentVisible(document:ContentDocument,now=new Date()){
 return (!document.startsAt||new Date(document.startsAt)<=now)&&(!document.endsAt||new Date(document.endsAt)>now);
}
