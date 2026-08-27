export const queryKeys = {
  patients: {
    all: ["patients"] as const,
    list: (params?: object) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
  },
  services: {
    all: ["services"] as const,
    list: (params?: object) => ["services", "list", params] as const,
  },
  payments: {
    all: ["payments"] as const,
    duePayments: (params?: object) =>
      ["payments", "due", params] as const,
    transactions: (params?: object) =>
      ["payments", "transactions", params] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (params?: object) => ["expenses", "list", params] as const,
  },
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
};
