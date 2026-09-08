"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function MediaUploader() {
  const [pending,setPending]=useState(false);const [message,setMessage]=useState("");const router=useRouter();
  return <form className="form" onSubmit={async event=>{
    event.preventDefault();const form=event.currentTarget;setPending(true);setMessage("");
    try{const result=await fetch("/api/media",{method:"POST",body:new FormData(form)});const data=await result.json();if(!result.ok)throw new Error(data.error);setMessage("Image uploaded.");form.reset();router.refresh();}catch(error){setMessage(error instanceof Error?error.message:"Upload failed. Please try again.");}finally{setPending(false);}
  }}><label>Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required/><small>JPG, PNG, or WebP · Maximum 10 MB</small></label><label>Image description<input name="alt" minLength={3} maxLength={300} required/><small>Describe the image for guests using screen readers.</small></label>{message&&<p role="status" className="message">{message}</p>}<button className="button" disabled={pending}>{pending?"Uploading…":"Upload image"}</button></form>;
}
