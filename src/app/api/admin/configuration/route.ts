import {z} from "zod";
import {revalidatePath} from "next/cache";
import {ForbiddenError} from "../../../../domain/permissions";
import {assertOrigin,currentUser} from "../../../../server/auth";
import {exportConfiguration,importConfiguration} from "../../../../server/configuration-transfer";
import {readJsonBody,RequestBodyError} from "../../../../server/request-body";

export async function GET(){
  const auth=await currentUser();if(!auth)return Response.json({error:"Sign in to export settings."},{status:401});
  try{const bundle=await exportConfiguration(auth.principal);return Response.json(bundle,{headers:{"Content-Disposition":`attachment; filename="hotel-settings-${auth.property.slug}.json"`,"Cache-Control":"private, no-store"}});}
  catch(error){return Response.json({error:error instanceof ForbiddenError?error.message:"Settings could not be exported."},{status:error instanceof ForbiddenError?403:400});}
}
export async function POST(request:Request){
  const auth=await currentUser();if(!auth)return Response.json({error:"Sign in to import settings."},{status:401});
  try{await assertOrigin();const result=await importConfiguration(auth.principal,await readJsonBody(request));revalidatePath("/","layout");return Response.json(result);}
  catch(error){const status=error instanceof ForbiddenError?403:error instanceof RequestBodyError?413:400;return Response.json({error:error instanceof z.ZodError?error.issues[0].message:error instanceof ForbiddenError||error instanceof RequestBodyError?error.message:"Settings could not be imported. Check image references and settings areas."},{status});}
}
