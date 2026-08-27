import { clsx } from "clsx";
import type { PaymentMethod } from "@/types/domain";

const methods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "online_payment", label: "Online Payment" },
  { value: "card", label: "Card" },
];

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {methods.map((method) => (
        <button
          key={method.value}
          type="button"
          onClick={() => onChange(method.value)}
          className={clsx(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            value === method.value
              ? "border-primary bg-primary-light text-primary-dark"
              : "border-border text-text-secondary hover:border-primary/40",
          )}
        >
          {method.label}
        </button>
      ))}
    </div>
  );
}
