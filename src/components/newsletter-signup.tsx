import {z} from "zod";
import {db} from "../server/db";
import {formFieldSchema} from "../domain/forms";
import {PublicForm} from "./public-form";
export async function NewsletterSignup({propertyId}:{propertyId:string}){
 const form=await db.customForm.findFirst({where:{propertyId,name:"Newsletter",active:true}});
 return form?<PublicForm id={form.id} fields={z.array(formFieldSchema).parse(form.fields)} label="Subscribe"/>:null;
}
