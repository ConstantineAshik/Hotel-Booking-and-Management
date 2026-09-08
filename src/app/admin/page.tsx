import Link from "next/link";
import {requireUser} from "../../server/auth";
import {dashboardSnapshot} from "../../server/dashboard";

export default async function Dashboard(){
  const {property,principal}=await requireUser();
  if(!principal.permissions.includes("reports.view"))return <div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Welcome back.</h1><p className="muted">Use the navigation to access your permitted areas.</p></div></div>;
  const dashboard=await dashboardSnapshot(principal);
  const money=(value:string|number)=>new Intl.NumberFormat("en",{style:"currency",currency:property.currency}).format(Number(value));
  const stayRow=(booking:(typeof dashboard.arrivals)[number],kind:"arrival"|"departure")=>{
    const rooms=booking.rooms.length,guests=booking.rooms.reduce((sum,room)=>sum+room.adults+room.children,0);
    return <Link className="list-row" href={`/admin/bookings/${booking.id}`} key={booking.id}><span><strong>{booking.guest.name}</strong><small>{booking.reference} · {rooms} {rooms===1?"room":"rooms"} · {guests} {guests===1?"guest":"guests"}</small></span><span className="badge">{kind==="arrival"?"Arriving":"Departing"}</span></Link>;
  };
  return <>
    <div className="page-heading"><div><span className="eyebrow">TODAY AT YOUR PROPERTY</span><h1>A warm welcome.</h1><p className="muted">The operating picture at {property.name}.</p></div><span className="date-label">{new Intl.DateTimeFormat("en",{dateStyle:"long",timeZone:property.timezone}).format(new Date())}</span></div>
    <div className="stats-grid dashboard-stats">
      <section className="stat"><span>Occupancy tonight</span><strong>{dashboard.metrics.occupancy}%</strong><small>{dashboard.metrics.occupied} of {dashboard.metrics.activeUnits} active rooms</small></section>
      <section className="stat"><span>Arrivals today</span><strong>{dashboard.metrics.arrivals}</strong><small>Upcoming reservations</small></section>
      <section className="stat"><span>Departures today</span><strong>{dashboard.metrics.departures}</strong><small>Expected check-outs</small></section>
      <section className="stat"><span>Net collected today</span><strong>{money(dashboard.metrics.net)}</strong><small>Payments less refunds</small></section>
      <section className="stat"><span>Outstanding balance</span><strong>{money(dashboard.metrics.outstanding)}</strong><small>Active stays and reservations</small></section>
    </div>
    {dashboard.canViewBookings?<div className="split-layout"><section className="panel"><div className="panel-heading"><h2>Today’s arrivals</h2><Link href="/admin/calendar">Open calendar →</Link></div>{dashboard.arrivals.map(booking=>stayRow(booking,"arrival"))}{!dashboard.arrivals.length?<div className="empty-state compact-empty"><p>No arrivals scheduled today.</p></div>:null}</section><section className="panel"><div className="panel-heading"><h2>Today’s departures</h2><Link href="/admin/bookings">All reservations →</Link></div>{dashboard.departures.map(booking=>stayRow(booking,"departure"))}{!dashboard.departures.length?<div className="empty-state compact-empty"><p>No departures scheduled today.</p></div>:null}</section></div>:null}
    <div className="split-layout">
      {dashboard.canViewBookings?<section className="panel"><div className="panel-heading"><h2>Recent reservations</h2><Link href="/admin/bookings">View all →</Link></div>{dashboard.recentBookings.map(booking=><Link className="list-row" href={`/admin/bookings/${booking.id}`} key={booking.id}><span><strong>{booking.guest.name}</strong><small>{booking.reference} · {booking.rooms[0]?.checkIn.toISOString().slice(0,10)??"Dates pending"}</small></span><span className={`badge ${booking.status==="CONFIRMED"?"green":""}`}>{booking.status.toLowerCase().replaceAll("_"," ")}</span></Link>)}{!dashboard.recentBookings.length?<div className="empty-state compact-empty"><p>No reservations recorded yet.</p></div>:null}</section>:null}
      {dashboard.canViewPayments?<section className="panel"><div className="panel-heading"><h2>Recent payments</h2><Link href="/admin/payments">Open ledger →</Link></div>{dashboard.recentPayments.map(payment=>{const refunded=payment.refunds.reduce((sum,refund)=>sum+Number(refund.amount),0);return <Link className="list-row" href={`/admin/bookings/${payment.bookingId}`} key={payment.id}><span><strong>{payment.booking.guest.name}</strong><small>{payment.provider} · {payment.externalId??"No reference"}</small></span><span><strong>{payment.currency} {(Number(payment.amount)-refunded).toFixed(2)}</strong><small>{refunded?"Net of refunds":"Collected"}</small></span></Link>})}{!dashboard.recentPayments.length?<div className="empty-state compact-empty"><p>No successful payments recorded yet.</p></div>:null}</section>:null}
    </div>
    <p className="muted dashboard-note">Today uses {dashboard.property.timezone}. Collections reflect successful ledger entries recorded today; outstanding balance covers active bookings.</p>
  </>;
}
