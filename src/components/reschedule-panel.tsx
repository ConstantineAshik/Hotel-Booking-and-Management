import {requireUser} from "../server/auth";import {db} from "../server/db";import {RescheduleForm} from "./reschedule-form";
export async function ReschedulePanel({bookingId}:{bookingId:string}){
 const {property,principal}=await requireUser("booking.view");if(!principal.permissions.includes("booking.edit"))return null;
 const [booking,rates,units]=await Promise.all([db.booking.findFirstOrThrow({where:{id:bookingId,propertyId:property.id},include:{rooms:true}}),db.ratePlan.findMany({where:{propertyId:property.id,active:true},include:{roomType:true},orderBy:{name:"asc"}}),db.roomUnit.findMany({where:{propertyId:property.id,status:"ACTIVE"},orderBy:{number:"asc"}})]);
 if(!["CONFIRMED","PENDING"].includes(booking.status)||!booking.rooms.length)return null;
 return <RescheduleForm booking={{id:booking.id,version:booking.version,total:booking.total.toString(),checkIn:booking.rooms[0].checkIn.toISOString().slice(0,10),checkOut:booking.rooms[0].checkOut.toISOString().slice(0,10),adults:booking.rooms.reduce((s,r)=>s+r.adults,0),children:booking.rooms.reduce((s,r)=>s+r.children,0),rooms:booking.rooms.length,ratePlanId:booking.rooms[0].ratePlanId}} rates={rates.map(r=>({id:r.id,name:r.name,roomName:r.roomType.name}))} units={units}/>;
}
