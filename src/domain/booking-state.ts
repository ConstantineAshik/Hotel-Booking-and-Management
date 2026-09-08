export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["CHECKED_OUT"],
  CHECKED_OUT: [], CANCELLED: [], NO_SHOW: [],
};

export function assertBookingTransition(from: BookingStatus, to: BookingStatus): void {
  if (!transitions[from].includes(to)) throw new Error(`Invalid booking transition: ${from} to ${to}`);
}
