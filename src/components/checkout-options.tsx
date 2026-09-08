"use client";
import {useRouter,useSearchParams} from "next/navigation";
type Service={id:string;name:string;description:string;price:string;pricingType:string;maxQuantity:number};
export function CheckoutOptions({services,promoCode}:{services:Service[];promoCode:string}){
 const router=useRouter(),params=useSearchParams();
 const selected=new Map((params.get("services")??"").split(",").filter(Boolean).map(item=>{const [id,quantity]=item.split(":");return[id,quantity]}));
 function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const form=new FormData(event.currentTarget),next=new URLSearchParams(params);
  const values=services.flatMap(service=>{const quantity=Number(form.get(`service:${service.id}`));return quantity>0?[`${service.id}:${quantity}`]:[]});
  if(values.length)next.set("services",values.join(","));else next.delete("services");
  const promo=String(form.get("promoCode")??"").trim();if(promo)next.set("promo",promo);else next.delete("promo");router.push(`?${next}`);
 }
 return <form className="form checkout-options" onSubmit={submit}><h2>Personalize your stay</h2>{services.map(service=><label key={service.id}>{service.name} · {service.price}<small>{service.pricingType.toLowerCase().replaceAll("_"," ")} · {service.description}</small><select name={`service:${service.id}`} defaultValue={selected.get(service.id)??"0"}><option value="0">Do not add</option>{Array.from({length:service.maxQuantity},(_,index)=><option key={index+1} value={index+1}>{index+1}</option>)}</select></label>)}<label>Promo code<input name="promoCode" defaultValue={promoCode} maxLength={40}/></label><button className="button secondary">Update total</button></form>;
}
