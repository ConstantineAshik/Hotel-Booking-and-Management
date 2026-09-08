export const permissions = [
  "booking.view", "booking.create", "booking.edit", "booking.cancel", "booking.checkin",
  "guest.view", "guest.edit", "payments.view", "payments.edit", "payments.refund",
  "rooms.view", "rooms.edit", "rates.edit", "availability.edit", "website.edit",
  "website.publish", "website.scripts", "media.edit", "reports.view", "reports.export",
  "users.manage", "roles.manage", "settings.manage", "integrations.manage", "audit.view",
] as const;
export type Permission = typeof permissions[number];

export interface Principal {
  userId: string;
  propertyId: string;
  permissions: readonly Permission[];
  disabled: boolean;
}

export class ForbiddenError extends Error {
  constructor() { super("You do not have permission to perform this action."); }
}

export function authorize(principal: Principal | null, propertyId: string, permission: Permission): void {
  if (!principal || principal.disabled || principal.propertyId !== propertyId ||
      !principal.permissions.includes(permission)) throw new ForbiddenError();
}

export function validateDelegation(actor: Principal, requested: readonly Permission[]): void {
  authorize(actor, actor.propertyId, "roles.manage");
  if (requested.some(permission => !actor.permissions.includes(permission))) throw new ForbiddenError();
}

export const roleTemplates: Record<string, readonly Permission[]> = {
  "Super Admin": permissions,
  Administrator: permissions.filter(p => p !== "website.scripts" && p !== "integrations.manage" && p !== "roles.manage"),
  Manager: ["booking.view", "booking.create", "booking.edit", "booking.cancel", "booking.checkin", "guest.view", "guest.edit", "payments.view", "rooms.view", "rooms.edit", "rates.edit", "availability.edit", "reports.view"],
  Receptionist: ["booking.view", "booking.create", "booking.checkin", "guest.view", "guest.edit", "rooms.view", "payments.view"],
  "Booking Manager": ["booking.view", "booking.create", "booking.edit", "booking.cancel", "guest.view", "rooms.view", "availability.edit"],
  Accountant: ["payments.view", "payments.edit", "payments.refund", "reports.view", "reports.export"],
  "Content Manager": ["website.edit", "website.publish", "media.edit"],
};
