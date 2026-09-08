"use server";
import {z} from "zod";import {revalidatePath} from "next/cache";
import {requireUser,assertOrigin} from "./auth";
import {reserve,changeBookingStatus,BookingError} from "./booking";
import type {FormState} from "../components/action-form";
import {reschedule} from "./reschedule";
export async function rescheduleAction(_:FormState,form:FormData):Promise<FormState>{
 const auth=await requireUser("booking.edit");try{await assertOrigin();if(form.get("confirmation")!=="CONFIRM")return{error:"Type CONFIRM to change the reservation."};const raw=Object.fromEntries(form);await reschedule(auth.principal,{...raw,version:Number(raw.version),stay:{checkIn:raw.checkIn,checkOut:raw.checkOut,adults:Number(raw.adults),children:Number(raw.children),rooms:Number(raw.rooms)}});revalidatePath("/admin","layout");return{success:"Reservation updated. Review any remaining balance or refund due."};}catch(error){return{error:error instanceof BookingError?error.message:"The reservation could not be changed. Check the details and try again."};}
}
export async function manualBooking(_:FormState,form:FormData):Promise<FormState>{
 const auth=await requireUser("booking.create");try{await assertOrigin();const raw=Object.fromEntries(form);const result=await reserve(auth.property.id,{...raw,acceptedPolicy:form.has("acceptedPolicy"),stay:{checkIn:raw.checkIn,checkOut:raw.checkOut,adults:Number(raw.adults),children:Number(raw.children),rooms:Number(raw.rooms)}},auth.principal);revalidatePath("/admin/bookings");revalidatePath("/admin/calendar");return{success:`Reservation ${result.booking.reference} confirmed.`};}catch(error){return{error:error instanceof BookingError?error.message:"Check the dates, guest details, rate, and quoted amount."};}
}
export async function updateBookingStatus(_:FormState,form:FormData):Promise<FormState>{
 const auth=await requireUser("booking.view");try{await assertOrigin();if(form.get("confirmation")!=="CONFIRM")return{error:"Type CONFIRM to apply this status change."};const id=z.uuid().parse(form.get("id"));const status=z.enum(["PENDING","CONFIRMED","CHECKED_IN","CHECKED_OUT","CANCELLED","NO_SHOW"]).parse(form.get("status"));const note=z.string().max(2000).parse(form.get("note")??"");await changeBookingStatus(auth.principal,id,status,note);revalidatePath("/admin", "layout");return{success:"Booking status updated."};}catch(error){return{error:error instanceof BookingError?error.message:"This status change is not permitted."};}
}
