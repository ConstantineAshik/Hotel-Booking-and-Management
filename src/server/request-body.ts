export class RequestBodyError extends Error{}
/** Enforce the byte limit while reading, including requests without Content-Length. */
export async function readJsonBody(request:Request,limit=256*1024):Promise<unknown>{
 const length=request.headers.get("content-length");
 if(length&&Number(length)>limit)throw new RequestBodyError("This request is too large.");
 if(!request.body)throw new RequestBodyError("A request body is required.");
 const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new RequestBodyError("This request is too large.");}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}catch{throw new RequestBodyError("Send a valid JSON request.");}
}
