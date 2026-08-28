import { clsx } from "clsx";
import { PAYMENT_METHOD_OPTIONS } from "@/utils/paymentMethod";
import type { PaymentMethod } from "@/types/domain";

const methods = PAYMENT_METHOD_OPTIONS;

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
