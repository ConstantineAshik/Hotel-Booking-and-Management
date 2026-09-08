import {authorize,type Principal} from "../domain/permissions";
import {db} from "./db";

type MetricRow={arrivals:number;departures:number;occupied:number;activeUnits:number;collected:string;refunded:string;outstanding:string};

export async function dashboardSnapshot(principal:Principal){
  authorize(principal,principal.propertyId,"reports.view");
  const property=await db.property.findUniqueOrThrow({where:{id:principal.propertyId}});
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:property.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const canViewBookings=principal.permissions.includes("booking.view");
  const canViewPayments=principal.permissions.includes("payments.view");
  const [rows,arrivals,departures,recentBookings,recentPayments]=await Promise.all([
    db.$queryRaw<MetricRow[]>`
      SELECT
        (SELECT count(DISTINCT b.id)::int FROM "Booking" b JOIN "BookingRoom" br ON br."bookingId"=b.id WHERE b."propertyId"=${property.id}::uuid AND br."checkIn"=${today}::date AND b.status IN ('PENDING','CONFIRMED')) AS arrivals,
        (SELECT count(DISTINCT b.id)::int FROM "Booking" b JOIN "BookingRoom" br ON br."bookingId"=b.id WHERE b."propertyId"=${property.id}::uuid AND br."checkOut"=${today}::date AND b.status IN ('PENDING','CONFIRMED','CHECKED_IN')) AS departures,
        (SELECT count(*)::int FROM "InventoryNight" n WHERE n."propertyId"=${property.id}::uuid AND n.date=${today}::date AND n."bookingRoomId" IS NOT NULL) AS occupied,
        (SELECT count(*)::int FROM "RoomUnit" u WHERE u."propertyId"=${property.id}::uuid AND u.status='ACTIVE') AS "activeUnits",
        (SELECT coalesce(sum(p.amount),0)::numeric(18,2)::text FROM "Payment" p WHERE p."propertyId"=${property.id}::uuid AND p.status='SUCCEEDED' AND (p."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date=${today}::date) AS collected,
        (SELECT coalesce(sum(r.amount),0)::numeric(18,2)::text FROM "Refund" r JOIN "Payment" p ON p.id=r."paymentId" WHERE p."propertyId"=${property.id}::uuid AND r.status='SUCCEEDED' AND (r."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date=${today}::date) AS refunded,
        (SELECT coalesce(sum(greatest(b.total-coalesce((SELECT sum(p.amount) FROM "Payment" p WHERE p."bookingId"=b.id AND p.status='SUCCEEDED'),0)+coalesce((SELECT sum(r.amount) FROM "Refund" r JOIN "Payment" p ON p.id=r."paymentId" WHERE p."bookingId"=b.id AND r.status='SUCCEEDED'),0),0)),0)::numeric(18,2)::text FROM "Booking" b WHERE b."propertyId"=${property.id}::uuid AND b.status IN ('PENDING','CONFIRMED','CHECKED_IN')) AS outstanding`,
    canViewBookings?db.booking.findMany({where:{propertyId:property.id,status:{in:["PENDING","CONFIRMED"]},rooms:{some:{checkIn:new Date(today)}}},include:{guest:true,rooms:{orderBy:{checkIn:"asc"}}},orderBy:{createdAt:"asc"},take:8}):[],
    canViewBookings?db.booking.findMany({where:{propertyId:property.id,status:{in:["PENDING","CONFIRMED","CHECKED_IN"]},rooms:{some:{checkOut:new Date(today)}}},include:{guest:true,rooms:{orderBy:{checkOut:"asc"}}},orderBy:{createdAt:"asc"},take:8}):[],
    canViewBookings?db.booking.findMany({where:{propertyId:property.id},include:{guest:true,rooms:{orderBy:{checkIn:"asc"},take:1}},orderBy:{createdAt:"desc"},take:6}):[],
    canViewPayments?db.payment.findMany({where:{propertyId:property.id,status:"SUCCEEDED"},include:{booking:{include:{guest:true}},refunds:{where:{status:"SUCCEEDED"}}},orderBy:{createdAt:"desc"},take:6}):[],
  ]);
  const metrics=rows[0];
  return {property,today,metrics:{...metrics,net:(Number(metrics.collected)-Number(metrics.refunded)).toFixed(2),occupancy:metrics.activeUnits?Math.round(metrics.occupied/metrics.activeUnits*100):0},arrivals,departures,recentBookings,recentPayments,canViewBookings,canViewPayments};
}
