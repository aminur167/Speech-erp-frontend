"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { SearchField } from "@/components/ui/SearchField";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { RowDetailDrawer, useRowDetail } from "@/components/ui/RowDetailDrawer";
import { CollectAdvanceModal } from "@/components/enrollments/CollectAdvanceModal";
import { useBookings } from "@/hooks/enrollments/useBookings";
import { formatCurrency } from "@/utils/currency";
import { formatTimeLabel } from "@/utils/time";
import type { Booking } from "@/types/domain";

type PaymentFilter = "" | "paid" | "pending";

/**
 * Every booking made through Online Services — a staff-made one and a
 * website one look identical here except for the Payment column: a website
 * visitor's booking (`create_public_booking`) is confirmed with no advance
 * taken yet, so it shows Pending with a way to collect it, right where a
 * manager is already looking to book the next appointment.
 */
export function OnlineBookingsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Booking["status"] | "">("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("");
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);
  const detail = useRowDetail<Booking>();

  const { data, isLoading, isFetching, isError, refetch } = useBookings({
    status: status || undefined,
  });

  const bookings = useMemo(() => {
    const all = data?.results ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((booking) => {
      if (paymentFilter === "paid" && !booking.advancePaid) return false;
      if (paymentFilter === "pending" && booking.advancePaid) return false;
      if (!term) return true;
      return (
        booking.patientName.toLowerCase().includes(term) ||
        booking.patientPhone.toLowerCase().includes(term) ||
        booking.bookingCode.toLowerCase().includes(term)
      );
    });
  }, [data, search, paymentFilter]);

  const pendingCount = (data?.results ?? []).filter((b) => !b.advancePaid).length;

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        search={
          <SearchField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient, phone or booking code…"
          />
        }
      >
        <Select
          label="Payment"
          value={paymentFilter}
          onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as Booking["status"] | "")}
          containerClassName={FILTER_FIELD_WIDTH}
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </FilterBar>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-secondary">
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
              {pendingCount > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-warning">
                    {pendingCount} awaiting payment
                  </span>
                </>
              )}
            </p>
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
          </div>

          {isLoading && <LoadingState label="Loading bookings…" />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && bookings.length === 0 && (
            <EmptyState label="No online bookings match these filters." />
          )}

          {!isLoading && !isError && bookings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="py-2 pr-4 font-medium">Booking</th>
                    <th className="py-2 pr-4 font-medium">Patient</th>
                    <th className="py-2 pr-4 font-medium">Service</th>
                    <th className="py-2 pr-4 font-medium">Date &amp; Time</th>
                    <th className="py-2 pr-4 text-right font-medium">Advance</th>
                    <th className="py-2 pr-4 font-medium">Payment</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="w-10 py-2 pr-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} {...detail.rowProps(booking)}>
                      <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                        {booking.bookingCode}
                      </td>
                      <td className="py-2 pr-4">
                        <p className="font-medium text-text-primary">{booking.patientName}</p>
                        <p className="text-xs text-text-secondary">{booking.patientPhone}</p>
                      </td>
                      <td className="py-2 pr-4">{booking.serviceName}</td>
                      <td className="whitespace-nowrap py-2 pr-4">
                        {booking.date} at {formatTimeLabel(booking.time)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatCurrency(booking.advanceAmount)}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          tone={booking.advancePaid ? "success" : "warning"}
                          label={booking.advancePaid ? "Paid" : "Pending"}
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          tone={booking.status === "confirmed" ? "info" : "danger"}
                          label={booking.status}
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {!booking.advancePaid && booking.status === "confirmed" && (
                          <Button
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCollectingBooking(booking);
                            }}
                          >
                            Collect Payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <RowDetailDrawer
        open={detail.isOpen}
        onClose={detail.close}
        title={detail.selected?.bookingCode ?? ""}
        subtitle={detail.selected?.patientName}
        data={detail.selected}
      />

      <CollectAdvanceModal booking={collectingBooking} onClose={() => setCollectingBooking(null)} />
    </div>
  );
}
