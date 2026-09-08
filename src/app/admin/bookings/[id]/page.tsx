import Link from "next/link";
import {notFound} from "next/navigation";
import {ActionForm} from "../../../../components/action-form";
import {InvoicePanel} from "../../../../components/invoice-panel";
import {PaymentPanel} from "../../../../components/payment-panel";
import {ReschedulePanel} from "../../../../components/reschedule-panel";
import {requireUser} from "../../../../server/auth";
import {updateBookingStatus} from "../../../../server/booking-actions";
import {db} from "../../../../server/db";

type PricingSnapshot={
  nightly?:{date:string;amount:string}[];
  extras?:{id?:string;name:string;quantity:number;total:string}[];
  taxes?:{name:string;amount:string;included:boolean}[];
  discount?:string;
  roomName?:string;
  rateName?:string;
};

export default async function BookingDetail({params}:{params:Promise<{id:string}>}){
  const {property}=await requireUser("booking.view");
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/.test(id))notFound();
  const booking=await db.booking.findFirst({
    where:{id,propertyId:property.id},
    include:{
      guest:true,
      rooms:true,
      source:true,
      events:{orderBy:{createdAt:"desc"}},
      payments:{include:{refunds:true}},
      redemptions:{include:{promo:true}},
    },
  });
  if(!booking)notFound();
  const snapshot=booking.pricingSnapshot as unknown as PricingSnapshot;
  const paid=booking.payments
    .filter(payment=>payment.status==="SUCCEEDED")
    .reduce((sum,payment)=>sum+Number(payment.amount)-payment.refunds.filter(refund=>refund.status==="SUCCEEDED").reduce((refundSum,refund)=>refundSum+Number(refund.amount),0),0);

  return <>
    <Link className="back-link" href="/admin/bookings">← Reservations</Link>
    <div className="page-heading">
      <div>
        <span className="eyebrow">BOOKING {booking.reference}</span>
        <h1>{booking.guest.name}’s stay.</h1>
        <p className="muted">{booking.source.name} · Created {booking.createdAt.toLocaleDateString("en")}</p>
      </div>
      <span className="badge green">{booking.status.replaceAll("_"," ")}</span>
    </div>
    <div className="split-layout">
      <section className="panel padded">
        <h2>Guest and stay details</h2>
        <div className="detail-grid">
          <div>
            <small>Guest</small>
            <strong>{booking.guest.name}</strong>
            <p>{booking.guest.email}</p>
            <p>{booking.guest.phone}</p>
          </div>
          <div>
            <small>Accommodation</small>
            <strong>{snapshot.roomName}</strong>
            <p>{snapshot.rateName}</p>
            {booking.rooms.map(room=><p key={room.id}>Room {String((room.snapshot as Record<string,string>).unitNumber)} · {room.adults} adults · {room.children} children</p>)}
          </div>
        </div>
        <div className="summary-dates">
          <span>Check-in<strong>{booking.rooms[0]?.checkIn.toISOString().slice(0,10)}</strong></span>
          <span>Check-out<strong>{booking.rooms[0]?.checkOut.toISOString().slice(0,10)}</strong></span>
        </div>
        <h3>Booking timeline</h3>
        <div className="timeline">{booking.events.map(event=><div key={event.id}><span className="dot"/><section><strong>{event.kind.replaceAll("_"," ")}</strong><small>{event.createdAt.toLocaleString("en")}</small>{(event.data as Record<string,string>).note?<p>{(event.data as Record<string,string>).note}</p>:null}</section></div>)}</div>
      </section>
      <section className="panel padded">
        <h2>Price breakdown</h2>
        <div className="price-lines">
          {snapshot.nightly?.map(night=><div key={night.date}><span>{night.date}</span><span>{night.amount}</span></div>)}
          {snapshot.extras?.map((extra,index)=><div key={extra.id??`${extra.name}-${index}`}><span>{extra.name} × {extra.quantity}</span><span>{extra.total}</span></div>)}
          {snapshot.discount&&Number(snapshot.discount)>0?<div><span>Promotion{booking.redemptions[0]? ` · ${booking.redemptions[0].promo.code}`:""}</span><span>−{snapshot.discount}</span></div>:null}
          {snapshot.taxes?.map(tax=><div key={tax.name}><span>{tax.name}{tax.included?" (included)":""}</span><span>{tax.amount}</span></div>)}
          <div className="total"><strong>Total</strong><strong>{booking.currency} {booking.total.toString()}</strong></div>
          <div><span>Paid</span><span>{paid.toFixed(2)}</span></div>
          <div><strong>Balance</strong><strong>{(Number(booking.total)-paid).toFixed(2)}</strong></div>
        </div>
        <h3>Change booking status</h3>
        <ActionForm action={updateBookingStatus} label="Apply status change">
          <input name="id" type="hidden" value={booking.id}/>
          <label>New status<select name="status"><option value="CHECKED_IN">Check in</option><option value="CHECKED_OUT">Check out</option><option value="CANCELLED">Cancel booking</option><option value="NO_SHOW">Mark no-show</option></select></label>
          <label>Note<textarea name="note"/></label>
          <label>Type CONFIRM to apply<input name="confirmation" required pattern="CONFIRM"/></label>
        </ActionForm>
      </section>
    </div>
    <InvoicePanel bookingId={booking.id}/>
    <PaymentPanel bookingId={booking.id}/>
    <ReschedulePanel bookingId={booking.id}/>
  </>;
}
