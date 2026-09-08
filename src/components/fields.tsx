export function Field({name,label,value="",type="text",required=false,min,max,step}:{name:string;label:string;value?:string|number;type?:string;required?:boolean;min?:number;max?:number;step?:string}){
  return <label>{label}<input name={name} type={type} defaultValue={value} required={required} min={min} max={max} step={step}/></label>;
}
