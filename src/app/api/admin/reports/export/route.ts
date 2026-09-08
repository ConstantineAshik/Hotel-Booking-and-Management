import {currentUser} from "../../../../../server/auth";
import {propertyReport} from "../../../../../server/reports";
import {authorize,ForbiddenError} from "../../../../../domain/permissions";
import {csv} from "../../../../../domain/reports";
export async function GET(request:Request){
 const auth=await currentUser();if(!auth)return Response.json({error:"Sign in to export reports."},{status:401});
 try{authorize(auth.principal,auth.property.id,"reports.export");const query=new URL(request.url).searchParams;const report=await propertyReport(auth.principal,{from:query.get("from"),to:query.get("to")});
  const body=csv([
   ["Date",`Room revenue (${report.currency})`,`Collected (${report.currency})`,`Refunded (${report.currency})`,`Net collected (${report.currency})`,"New reservations","Occupied room-nights","Available room-nights","Timezone"],
   ...report.days.map(day=>[day.date,day.roomRevenue,day.collected,day.refunded,day.net,day.bookings,day.roomNights,day.availableRooms,report.timezone]),[],
   ["Tax","Applications",`Amount (${report.currency})`],...report.taxes.map(row=>[row.label,row.count,row.amount]),[],
   ["Room type","Occupied room-nights",`Room revenue (${report.currency})`],...report.rooms.map(row=>[row.label,row.roomNights,row.amount]),[],
   ["Guest","Reservations",`Booking value (${report.currency})`],...report.guests.map(row=>[row.label,row.count,row.amount]),
  ]);
  return new Response(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="hotel-report-${report.period.from}-${report.period.to}.csv"`,"Cache-Control":"private, no-store"}});
 }catch(error){return Response.json({error:error instanceof ForbiddenError?error.message:"Choose a valid report period of up to 366 days."},{status:error instanceof ForbiddenError?403:400});}
}
