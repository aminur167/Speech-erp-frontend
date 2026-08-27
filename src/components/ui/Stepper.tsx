import { clsx } from "clsx";

export function Stepper({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
      {steps.map((label, index) => (
        <div
          key={label}
          className={clsx(
            "flex items-center gap-2",
            index <= currentIndex ? "font-medium text-primary-dark" : "text-text-secondary",
          )}
        >
          <span
            className={clsx(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs",
              index <= currentIndex ? "bg-primary text-white" : "bg-border text-text-secondary",
            )}
          >
            {index + 1}
          </span>
          {label}
          {index < steps.length - 1 && <span className="mx-1 text-border">→</span>}
        </div>
      ))}
    </div>
  );
}
