import type { Booking } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/bookings/` endpoints.
 */

let bookings: Booking[] = [];
let sequence = 0;

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generateBookingCode(): string {
  sequence += 1;
  const year = new Date().getFullYear();
  return `BKG-${year}-${String(sequence).padStart(5, "0")}`;
}

export interface CreateBookingInput {
  patientId: string;
  serviceId: string;
  branchId: string;
  date: string;
  time: string;
  advanceAmount: number;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  await delay(null);
  const booking: Booking = {
    id: `bkg-${Date.now()}`,
    bookingCode: generateBookingCode(),
    status: "confirmed",
    ...input,
  };
  bookings = [booking, ...bookings];
  return booking;
}
