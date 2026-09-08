import {z} from "zod";import {isoDate} from "./stay";
export const formFieldSchema=z.object({key:z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),label:z.string().min(1).max(200),type:z.enum(["text","email","phone","textarea","number","dropdown","checkbox","date"]),required:z.boolean(),options:z.array(z.string().min(1).max(200)).max(30).default([])}).strict();
export type FormField=z.infer<typeof formFieldSchema>;
export const formDefinitionSchema=z.object({id:z.uuid().optional(),name:z.string().min(2).max(100),active:z.boolean(),fields:z.array(formFieldSchema).min(1).max(30)}).refine(f=>new Set(f.fields.map(v=>v.key)).size===f.fields.length,"Each form field needs a unique name");
export function submissionSchema(fields:FormField[]){return z.object(Object.fromEntries(fields.map(field=>{
 let schema:z.ZodType<string | number | boolean>;
 if(field.type==="checkbox")schema=field.required?z.literal(true):z.boolean();
 else if(field.type==="number")schema=field.required?z.number().finite().min(-10000000).max(10000000):z.union([z.number().finite().min(-10000000).max(10000000),z.literal("")]);
 else{let value: z.ZodType<string>=field.type==="email"?z.email().max(254):field.type==="date"?isoDate:field.type==="dropdown"?z.string().refine(v=>field.options.includes(v),"Choose an available option"):z.string().max(field.type==="textarea"?5000:500);if(field.required)value=value.refine(v=>typeof v!=="string"||v.trim().length>0,"This field is required");else value=z.union([value,z.literal("")]);schema=value;}
 return[field.key,schema];
}))).strict();}
