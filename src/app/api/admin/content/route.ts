import {z} from "zod";
import {revalidatePath} from "next/cache";
import {currentUser,assertOrigin} from "../../../../server/auth";
import {saveContent,ContentValidationError} from "../../../../server/content";
import {CmsConflict} from "../../../../server/cms";
import {ForbiddenError} from "../../../../domain/permissions";
import {readJsonBody,RequestBodyError} from "../../../../server/request-body";

export async function POST(request:Request){
 const auth=await currentUser();if(!auth)return Response.json({error:"Sign in to edit content."},{status:401});
 try{await assertOrigin();const result=await saveContent(auth.principal,await readJsonBody(request));revalidatePath("/","layout");return Response.json(result);}
 catch(error){const status=error instanceof ForbiddenError?403:error instanceof CmsConflict?409:400;const message=error instanceof RequestBodyError||error instanceof ContentValidationError||error instanceof CmsConflict||error instanceof ForbiddenError?error.message:error instanceof z.ZodError?error.issues[0].message:"Content could not be saved. Check that this address is unique and try again.";return Response.json({error:message},{status});}
}
