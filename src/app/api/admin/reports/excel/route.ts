import {ForbiddenError,authorize} from "../../../../../domain/permissions";
import {currentUser} from "../../../../../server/auth";
import {reportWorkbook} from "../../../../../server/report-workbook";
import {propertyReport} from "../../../../../server/reports";
export async function GET(request:Request){
 const auth=await currentUser();if(!auth)return Response.json({error:"Sign in to export reports."},{status:401});
 try{authorize(auth.principal,auth.property.id,"reports.export");const query=new URL(request.url).searchParams,report=await propertyReport(auth.principal,{from:query.get("from"),to:query.get("to")}),body=await reportWorkbook(report);return new Response(new Uint8Array(body),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="hotel-report-${report.period.from}-${report.period.to}.xlsx"`,"Cache-Control":"private, no-store"}});}
 catch(error){return Response.json({error:error instanceof ForbiddenError?error.message:"Choose a valid report period of up to 366 days."},{status:error instanceof ForbiddenError?403:400});}
}
