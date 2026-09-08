import {z} from "zod";
import {isoDate} from "./stay";
export const reportPeriodSchema=z.object({from:isoDate,to:isoDate}).refine(value=>value.to>=value.from&&Date.parse(value.to)-Date.parse(value.from)<=365*86400000,"Choose a report period of up to 366 days");
export function csvCell(value:string|number){const text=String(value);const safe=/^[\s]*[=+@-]/.test(text)&&! /^-?\d+(\.\d+)?$/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`;}
export function csv(rows:(string|number)[][]){return "\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";}
