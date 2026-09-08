import {getSettings} from "../../../server/cms";
import {db} from "../../../server/db";
import {searchAvailability} from "../../../server/availability";
export async function GET(request:Request){
 const property=await db.property.findFirst();if(!property)return Response.json({rooms:[]},{headers:{"Cache-Control":"no-store"}});
 const features=await getSettings(property.id,"features");
 const query=new URL(request.url).searchParams;
 try{const results=await searchAvailability(property.id,{checkIn:query.get("checkIn"),checkOut:query.get("checkOut"),adults:Number(query.get("adults")??2),children:Number(query.get("children")??0),rooms:Number(query.get("rooms")??1)});
 return Response.json({currency:property.currency,rooms:results.map(({room,rates,available})=>({id:room.id,name:room.name,slug:room.slug,description:room.description,...(features.showInventory?{available}:{}),image:room.images[0]?`/media/${room.images[0].mediaId}`:null,rates:rates.map(r=>({id:r.id,name:r.name,quote:r.quote}))}))},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Select valid dates and guest counts within the hotel's booking rules."},{status:400,headers:{"Cache-Control":"no-store"}});}
}
