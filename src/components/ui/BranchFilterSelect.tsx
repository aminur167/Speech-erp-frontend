"use client";

import { Select } from "@/components/ui/Select";
import { useBranches } from "@/hooks/branches/useBranches";

/** Branch picker for Admin-only views — lets Admin scope a page's data to one branch or "All branches". */
export function BranchFilterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (branchId: string) => void;
}) {
  const { data: branches } = useBranches();

  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      containerClassName="w-auto shrink-0"
      className="w-auto"
    >
      <option value="">All branches</option>
      {branches?.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {branch.name}
        </option>
      ))}
    </Select>
  );
}
