"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useCreateExpense } from "@/hooks/expenses/useCreateExpense";
import { EXPENSE_AUTO_APPROVE_THRESHOLD } from "@/lib/api/expenses";
import { formatCurrency } from "@/utils/currency";

const expenseSchema = z.object({
  category: z.enum([
    "rent",
    "utilities",
    "salaries",
    "supplies",
    "equipment",
    "maintenance",
    "marketing",
    "other",
  ]),
  amount: z
    .string()
    .min(1, "Amount is required.")
    .refine((value) => Number(value) > 0, "Enter an amount greater than 0."),
  description: z.string().min(3, "Description is required."),
  paidTo: z.string().min(2, "Payee / vendor name is required."),
  paymentMethod: z.enum([
    "cash",
    "bkash",
    "nagad",
    "rocket",
    "bank_transfer",
    "online_payment",
    "card",
  ]),
  remarks: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function ExpenseForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createExpense = useCreateExpense();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "supplies", paymentMethod: "cash" },
  });

  const amountValue = watch("amount");
  const willRequireApproval = Number(amountValue || 0) >= EXPENSE_AUTO_APPROVE_THRESHOLD;

  const onSubmit = (values: ExpenseFormValues) => {
    createExpense.mutate(
      { ...values, amount: Number(values.amount) },
      { onSuccess },
    );
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Category</label>
          <Select error={errors.category?.message} {...register("category")}>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="salaries">Salaries</option>
            <option value="supplies">Supplies</option>
            <option value="equipment">Equipment</option>
            <option value="maintenance">Maintenance</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Amount (BDT)
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="e.g. 5000"
            error={errors.amount?.message}
            {...register("amount")}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Description</label>
        <Input
          placeholder="What was this expense for?"
          error={errors.description?.message}
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Paid To</label>
          <Input
            placeholder="Vendor or payee name"
            error={errors.paidTo?.message}
            {...register("paidTo")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Payment Method
          </label>
          <Select {...register("paymentMethod")}>
            <option value="cash">Cash</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="online_payment">Online Payment</option>
            <option value="card">Card</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          Remarks (optional)
        </label>
        <Textarea rows={2} placeholder="Optional notes" {...register("remarks")} />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
          {...register("isRecurring")}
        />
        Recurring expense (e.g. monthly rent, salaries)
      </label>

      <p className="rounded-lg bg-primary-light/60 px-3 py-2 text-xs text-primary-dark">
        {willRequireApproval
          ? `This expense is ${formatCurrency(EXPENSE_AUTO_APPROVE_THRESHOLD)} or more and will be marked Pending until an Admin approves it.`
          : `This expense is below ${formatCurrency(EXPENSE_AUTO_APPROVE_THRESHOLD)} and will be auto-approved.`}
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createExpense.isPending}>
          Add Expense
        </Button>
      </div>
    </form>
  );
}
