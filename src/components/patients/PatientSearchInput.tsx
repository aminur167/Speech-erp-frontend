"use client";

import { useEffect, useState } from "react";
import { SearchField } from "@/components/ui/SearchField";

export function PatientSearchInput({
  onSearch,
  placeholder = "Search by name, phone, or patient ID",
  label = "Search patient",
}: {
  onSearch: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timeout);
  }, [value, onSearch]);

  return (
    <SearchField
      label={label}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
    />
  );
}
