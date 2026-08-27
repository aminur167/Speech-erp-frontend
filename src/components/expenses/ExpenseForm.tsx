"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreateExpense } from "@/hooks/expenses/useCreateExpense";
import { useAuthStore } from "@/store/authStore";
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
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function ExpenseForm({ basePath }: { basePath: string }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const createExpense = useCreateExpense();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "supplies" },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    createExpense.mutate(
      {
        ...values,
        amount: Number(values.amount),
        branchId: user?.branchId ?? "branch-1",
        submittedBy: user?.name ?? "Unknown",
      },
      { onSuccess: () => router.push(basePath) },
    );
  };

  return (
    <Card className="max-w-xl">
      <h1 className="text-lg font-semibold text-text-primary">Record Expense</h1>
      <p className="mt-1 text-xs text-text-secondary">
        Expenses of {formatCurrency(EXPENSE_AUTO_APPROVE_THRESHOLD)} or more require Admin
        approval before they&apos;re finalized.
      </p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
        <Input
          type="number"
          step="0.01"
          placeholder="Amount"
          error={errors.amount?.message}
          {...register("amount")}
        />
        <Input
          placeholder="Description"
          error={errors.description?.message}
          {...register("description")}
        />
        <Button type="submit" isLoading={createExpense.isPending}>
          Submit Expense
        </Button>
      </form>
    </Card>
  );
}
