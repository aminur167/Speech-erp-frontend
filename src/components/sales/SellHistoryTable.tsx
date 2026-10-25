"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { BranchFilterSelect } from "@/components/ui/BranchFilterSelect";
import { FilterBar, FILTER_FIELD_WIDTH } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { EditSaleCustomerModal } from "@/components/sales/EditSaleCustomerModal";
import { DeleteSaleDialog } from "@/components/sales/DeleteSaleDialog";
import { useSales } from "@/hooks/sales/useSales";
import { formatCurrency } from "@/utils/currency";
import { PAYMENT_METHOD_LABELS } from "@/utils/paymentMethod";
import type { MaterialSale } from "@/types/domain";

const PAGE_SIZE = 10;

/**
 * Sell History — the same table for both screens.
 *
 * The Manager opens it in a modal from the Sell page and sees their own
 * branch; Admin gets it as a page with an extra Branch column and a branch
 * filter. `showBranch` is the only difference, because the server already
 * decides what each role may see — the column is presentation, not access.
 */
export function SellHistoryTable({ showBranch = false }: { showBranch?: boolean }) {
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  // Every filter change returns to page 1 — staying on page 4 of a narrower
  // result set shows an empty table and reads as "no results".
  const change = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const [editing, setEditing] = useState<MaterialSale | null>(null);
  const [deleting, setDeleting] = useState<MaterialSale | null>(null);

  const sales = useSales({
    search,
    branchId: showBranch ? branchId : undefined,
    date,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows = sales.data?.results ?? [];
  const total = sales.data?.count ?? 0;
  const isFiltered = Boolean(search || date || branchId);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        search={
          <SearchField
            placeholder="Customer name, phone, product or receipt…"
            value={search}
            onChange={(event) => change(setSearch)(event.target.value)}
          />
        }
        dateSlot={
          <Input
            label="Date"
            type="date"
            containerClassName={FILTER_FIELD_WIDTH}
            value={date}
            onChange={(event) => change(setDate)(event.target.value)}
          />
        }
      >
        {showBranch && (
          <BranchFilterSelect value={branchId} onChange={change(setBranchId)} />
        )}
      </FilterBar>

      {sales.isError ? (
        <ErrorState onRetry={() => sales.refetch()} />
      ) : sales.isLoading ? (
        <TableSkeleton rows={5} columns={showBranch ? 6 : 5} />
      ) : rows.length === 0 ? (
        <EmptyState
          label={
            isFiltered
              ? "No sales match these filters. Try a different name, product or date."
              : "Nothing has been sold at the counter yet."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-background/60 text-left">
                <tr className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="px-4 py-3">Customer</th>
                  <th scope="col" className="px-4 py-3">Phone</th>
                  {showBranch && <th scope="col" className="px-4 py-3">Branch</th>}
                  <th scope="col" className="px-4 py-3">Products</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((sale) => (
                  <tr key={sale.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">
                        {sale.customerName}
                      </span>
                      <span className="block text-xs text-text-secondary">
                        {sale.receiptNumber}
                        {!sale.isWalkIn && " · Registered patient"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{sale.customerPhone}</td>
                    {showBranch && (
                      <td className="px-4 py-3 text-text-secondary">{sale.branchName}</td>
                    )}
                    <td className="px-4 py-3">
                      <ul className="flex flex-col gap-0.5">
                        {sale.items.map((line) => (
                          <li key={line.material} className="text-text-primary">
                            {line.name} × {line.quantity}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-text-primary">
                        {formatCurrency(Number(sale.total))}
                      </span>
                      <span className="block text-xs text-text-secondary">
                        {PAYMENT_METHOD_LABELS[sale.method] ?? sale.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        label={`Actions for ${sale.customerName}'s sale`}
                        items={[
                          {
                            key: "edit",
                            label: "Edit customer",
                            icon: Pencil,
                            onSelect: () => setEditing(sale),
                            disabled: !sale.isWalkIn,
                            hint: sale.isWalkIn
                              ? undefined
                              : "Registered patients are edited from their profile.",
                          },
                          {
                            key: "delete",
                            label: "Delete sale",
                            icon: Trash2,
                            tone: "danger",
                            onSelect: () => setDeleting(sale),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            count={total}
            onPageChange={setPage}
          />
        </>
      )}

      <EditSaleCustomerModal sale={editing} onClose={() => setEditing(null)} />
      <DeleteSaleDialog sale={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
