export const queryKeys = {
  patients: {
    all: ["patients"] as const,
    list: (params?: Record<string, unknown>) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
  },
  services: {
    all: ["services"] as const,
    list: (params?: Record<string, unknown>) => ["services", "list", params] as const,
  },
  payments: {
    all: ["payments"] as const,
    duePayments: (params?: Record<string, unknown>) =>
      ["payments", "due", params] as const,
    transactions: (params?: Record<string, unknown>) =>
      ["payments", "transactions", params] as const,
  },
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
};
