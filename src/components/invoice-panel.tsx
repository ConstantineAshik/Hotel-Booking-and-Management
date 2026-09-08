import Link from "next/link";import {db} from "../server/db";import {requireUser} from "../server/auth";import {ActionForm} from "./action-form";import {issueInvoice} from "../server/invoice-actions";
export async function InvoicePanel({bookingId}:{bookingId:string}){
 const {property,principal}=await requireUser("booking.view");if(!principal.permissions.includes("payments.view"))return null;const invoices=await db.invoice.findMany({where:{bookingId,propertyId:property.id}});
 return <section className="panel padded"><h2>Invoice</h2>{invoices.map(i=><Link key={i.id} className="text-link" href={`/admin/invoices/${i.id}`} target="_blank">Open {i.number} ↗</Link>)}{!invoices.length&&principal.permissions.includes("payments.edit")&&<ActionForm action={issueInvoice} label="Issue invoice"><input type="hidden" name="bookingId" value={bookingId}/><p className="muted">Creates a permanent snapshot of this reservation and its charges.</p></ActionForm>}</section>;
}
