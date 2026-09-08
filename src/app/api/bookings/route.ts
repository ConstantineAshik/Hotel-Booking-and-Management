import {readJsonBody} from "../../../server/request-body";
import {cookies} from "next/headers";
import {db} from "../../../server/db";
import {assertOrigin,rateLimit} from "../../../server/auth";
import {reserve,BookingError} from "../../../server/booking";
export async function POST(request:Request){
 try{await assertOrigin();}catch{return Response.json({error:"Request not permitted."},{status:403});}
 try{
  if(Number(request.headers.get("content-length")??0)>20000)return Response.json({error:"Request is too large."},{status:413});
  await rateLimit("booking:global",100,3600);
  const property=await db.property.findFirstOrThrow();const raw=await readJsonBody(request);
  const {booking,accessToken}=await reserve(property.id,raw);
  (await cookies()).set("booking_access",accessToken,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/confirmation",maxAge:86400*7});
  return Response.json({reference:booking.reference,confirmationUrl:`/confirmation/${booking.reference}`},{status:201});
 }catch(error){console.error(JSON.stringify({event:"booking.failed",code:error instanceof BookingError?"BOOKING_CONFLICT":typeof error==="object"&&error&&"code"in error?error.code:"VALIDATION_OR_SERVER_ERROR"}));return Response.json({error:error instanceof BookingError?error.message:"Your reservation could not be completed. Check the details and try again."},{status:409});}
}
