import Link from "next/link";
import { LayoutDashboard, BedDouble, DoorOpen, Sparkles, Images, Settings } from "lucide-react";
import type { Permission } from "../domain/permissions";
const items = [
  { href:"/admin", label:"Overview", icon:LayoutDashboard, permission:undefined },
  { href:"/admin/bookings", label:"Bookings", icon:DoorOpen, permission:"booking.view" },
  { href:"/admin/guests", label:"Guests", icon:DoorOpen, permission:"guest.view" },
  { href:"/admin/payments", label:"Payments", icon:LayoutDashboard, permission:"payments.view" },
  { href:"/admin/rooms", label:"Room types", icon:BedDouble, permission:"rooms.view" },
  { href:"/admin/units", label:"Room units", icon:DoorOpen, permission:"rooms.edit" },
  { href:"/admin/rates", label:"Rates & pricing", icon:BedDouble, permission:"rates.edit" },
  { href:"/admin/services", label:"Booking extras", icon:Sparkles, permission:"rates.edit" },
  { href:"/admin/promotions", label:"Promo codes", icon:Sparkles, permission:"rates.edit" },
  { href:"/admin/taxes", label:"Taxes & fees", icon:Settings, permission:"rates.edit" },
  { href:"/admin/calendar", label:"Availability", icon:LayoutDashboard, permission:"availability.edit" },
  { href:"/admin/amenities", label:"Amenities", icon:Sparkles, permission:"rooms.edit" },
  { href:"/admin/media", label:"Media library", icon:Images, permission:"media.edit" },
  { href:"/admin/website", label:"Website", icon:LayoutDashboard, permission:"website.edit" },
  { href:"/admin/content", label:"Content collections", icon:Images, permission:"website.edit" },
  { href:"/admin/forms", label:"Forms", icon:LayoutDashboard, permission:"website.edit" },
  { href:"/admin/inbox", label:"Inquiry inbox", icon:DoorOpen, permission:"website.edit" },
  { href:"/admin/notifications", label:"Emails & delivery", icon:Settings, permission:"settings.manage" },
  { href:"/admin/reports", label:"Reports", icon:LayoutDashboard, permission:"reports.view" },
  { href:"/admin/staff", label:"Staff accounts", icon:DoorOpen, permission:"users.manage" },
  { href:"/admin/roles", label:"Roles & permissions", icon:Settings, permission:"roles.manage" },
  { href:"/admin/audit", label:"Activity log", icon:LayoutDashboard, permission:"audit.view" },
  { href:"/admin/settings", label:"Hotel settings", icon:Settings, permission:"settings.manage" },
] as const;
export function AdminNav({permissions}:{permissions:readonly Permission[]}) {
  return <nav aria-label="Administration">{items.filter(i=>!i.permission||permissions.includes(i.permission)).map(i=><Link href={i.href} key={i.href}><span className="nav-item-label"><i.icon size={17} strokeWidth={1.6}/>{i.label}</span></Link>)}</nav>;
}
