import {db} from "./db";
import {authorize,type Principal} from "../domain/permissions";
import {reportPeriodSchema} from "../domain/reports";

type Day={date:string;collected:string;refunded:string;net:string;roomRevenue:string;bookings:number;roomNights:number;availableRooms:number};
type Breakdown={label:string;count:number;amount:string};
type RoomBreakdown=Breakdown&{roomNights:number};

export async function propertyReport(principal:Principal,raw:unknown){
 authorize(principal,principal.propertyId,"reports.view");const period=reportPeriodSchema.parse(raw);
 const property=await db.property.findUniqueOrThrow({where:{id:principal.propertyId}});
 const [days,sources,statuses,promos,taxes,guests,rooms]=await Promise.all([
  db.$queryRaw<Day[]>`
   WITH calendar AS (SELECT generate_series(${period.from}::date,${period.to}::date,interval '1 day')::date AS day),
   flows AS (
    SELECT (p."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date AS day,p.amount AS collected,0::numeric AS refunded
    FROM "Payment" p WHERE p."propertyId"=${property.id}::uuid AND p.status='SUCCEEDED'
    UNION ALL
    SELECT (r."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date,0::numeric,r.amount
    FROM "Refund" r JOIN "Payment" p ON p.id=r."paymentId" WHERE p."propertyId"=${property.id}::uuid AND r.status='SUCCEEDED'
   ), money AS (SELECT day,sum(collected) AS collected,sum(refunded) AS refunded FROM flows WHERE day BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY day),
   reservations AS (SELECT (b."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date AS day,count(*)::int AS count FROM "Booking" b WHERE b."propertyId"=${property.id}::uuid GROUP BY day),
   nights AS (SELECT c.day,count(br.id)::int AS count FROM calendar c JOIN "BookingRoom" br ON br."checkIn"<=c.day AND br."checkOut">c.day JOIN "Booking" b ON b.id=br."bookingId" WHERE b."propertyId"=${property.id}::uuid AND b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT') GROUP BY c.day),
   capacity AS (SELECT c.day,(SELECT count(*) FROM "RoomUnit" unit WHERE unit."propertyId"=${property.id}::uuid AND unit.status='ACTIVE')-count(DISTINCT u.id)::int AS count FROM calendar c LEFT JOIN "InventoryNight" n ON n.date=c.day AND n."propertyId"=${property.id}::uuid AND n."blockId" IS NOT NULL LEFT JOIN "RoomUnit" u ON u.id=n."unitId" AND u.status='ACTIVE' GROUP BY c.day),
   revenue AS (SELECT (night->>'date')::date AS day,sum((night->>'amount')::numeric) AS amount FROM "Booking" b CROSS JOIN LATERAL jsonb_array_elements(b."pricingSnapshot"->'nightly') night WHERE b."propertyId"=${property.id}::uuid AND b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT') AND (night->>'date')::date BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY day)
   SELECT c.day::text AS date,coalesce(m.collected,0)::numeric(18,2)::text AS collected,coalesce(m.refunded,0)::numeric(18,2)::text AS refunded,(coalesce(m.collected,0)-coalesce(m.refunded,0))::numeric(18,2)::text AS net,coalesce(v.amount,0)::numeric(18,2)::text AS "roomRevenue",coalesce(r.count,0)::int AS bookings,coalesce(n.count,0)::int AS "roomNights",greatest(coalesce(a.count,0),0)::int AS "availableRooms"
   FROM calendar c LEFT JOIN money m ON m.day=c.day LEFT JOIN reservations r ON r.day=c.day LEFT JOIN nights n ON n.day=c.day LEFT JOIN capacity a ON a.day=c.day LEFT JOIN revenue v ON v.day=c.day ORDER BY c.day`,
  db.$queryRaw<Breakdown[]>`SELECT s.name AS label,count(*)::int AS count,coalesce(sum(b.total),0)::numeric(18,2)::text AS amount FROM "Booking" b JOIN "BookingSource" s ON s.id=b."sourceId" WHERE b."propertyId"=${property.id}::uuid AND (b."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY s.name ORDER BY count DESC,s.name`,
  db.$queryRaw<Breakdown[]>`SELECT b.status::text AS label,count(*)::int AS count,coalesce(sum(b.total),0)::numeric(18,2)::text AS amount FROM "Booking" b WHERE b."propertyId"=${property.id}::uuid AND (b."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY b.status ORDER BY count DESC,b.status`,
  db.$queryRaw<Breakdown[]>`SELECT p.code AS label,count(*)::int AS count,coalesce(sum(r.amount),0)::numeric(18,2)::text AS amount FROM "PromoRedemption" r JOIN "PromoCode" p ON p.id=r."promoId" JOIN "Booking" b ON b.id=r."bookingId" WHERE r."propertyId"=${property.id}::uuid AND (b."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY p.code ORDER BY count DESC,p.code`,
  db.$queryRaw<Breakdown[]>`SELECT tax->>'name' AS label,count(*)::int AS count,coalesce(sum((tax->>'amount')::numeric),0)::numeric(18,2)::text AS amount FROM "Booking" b CROSS JOIN LATERAL jsonb_array_elements(b."pricingSnapshot"->'taxes') tax WHERE b."propertyId"=${property.id}::uuid AND b.status IN ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT') AND (b."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY tax->>'name' ORDER BY amount DESC,label`,
  db.$queryRaw<Breakdown[]>`SELECT g.name||' · '||g.email AS label,count(b.id)::int AS count,coalesce(sum(b.total),0)::numeric(18,2)::text AS amount FROM "Booking" b JOIN "Guest" g ON g.id=b."guestId" WHERE b."propertyId"=${property.id}::uuid AND (b."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${property.timezone})::date BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY g.id,g.name,g.email ORDER BY count DESC,g.name LIMIT 50`,
  db.$queryRaw<RoomBreakdown[]>`WITH revenue AS (SELECT b."pricingSnapshot"->>'roomName' AS room,sum((night->>'amount')::numeric) AS amount FROM "Booking" b CROSS JOIN LATERAL jsonb_array_elements(b."pricingSnapshot"->'nightly') night WHERE b."propertyId"=${property.id}::uuid AND b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT') AND (night->>'date')::date BETWEEN ${period.from}::date AND ${period.to}::date GROUP BY room), nights AS (SELECT br.snapshot->>'roomName' AS room,count(*)::int AS count FROM "BookingRoom" br JOIN "Booking" b ON b.id=br."bookingId" CROSS JOIN generate_series(greatest(br."checkIn",${period.from}::date),least(br."checkOut"-1,${period.to}::date),interval '1 day') day WHERE b."propertyId"=${property.id}::uuid AND b.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT') GROUP BY room) SELECT coalesce(r.room,n.room,'Unknown room') AS label,coalesce(n.count,0)::int AS count,coalesce(r.amount,0)::numeric(18,2)::text AS amount,coalesce(n.count,0)::int AS "roomNights" FROM revenue r FULL JOIN nights n ON n.room=r.room ORDER BY count DESC,label`,
 ]);
 const toMinor=(value:string)=>BigInt(value.replace(".","")),money=(value:bigint)=>`${value<0n?"-":""}${(value<0n?-value:value)/100n}.${((value<0n?-value:value)%100n).toString().padStart(2,"0")}`;
 const collected=days.reduce((sum,day)=>sum+toMinor(day.collected),0n),refunded=days.reduce((sum,day)=>sum+toMinor(day.refunded),0n),roomRevenue=days.reduce((sum,day)=>sum+toMinor(day.roomRevenue),0n);
 const bookings=days.reduce((sum,day)=>sum+day.bookings,0),roomNights=days.reduce((sum,day)=>sum+day.roomNights,0),availableRoomNights=days.reduce((sum,day)=>sum+day.availableRooms,0);
 const cancelled=statuses.find(status=>status.label==="CANCELLED")?.count??0,totalBookingValue=sources.reduce((sum,source)=>sum+toMinor(source.amount),0n);
 const ratio=(numerator:bigint,denominator:number)=>denominator?money((numerator+BigInt(Math.floor(denominator/2)))/BigInt(denominator)):"0.00";
 return {period,currency:property.currency,timezone:property.timezone,days,sources,statuses,promos,taxes,guests,rooms,totals:{collected:money(collected),refunded:money(refunded),net:money(collected-refunded),roomRevenue:money(roomRevenue),bookings,roomNights,availableRoomNights,occupancy:availableRoomNights?(roomNights/availableRoomNights*100).toFixed(1):"0.0",averageBookingValue:ratio(totalBookingValue,bookings),adr:ratio(roomRevenue,roomNights),revpar:ratio(roomRevenue,availableRoomNights),cancellationRate:bookings?(cancelled/bookings*100).toFixed(1):"0.0"}};
}
