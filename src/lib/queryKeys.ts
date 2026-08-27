export const queryKeys = {
  patients: {
    all: ["patients"] as const,
    list: (params?: object) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
    directory: (params?: object) => ["patients", "directory", params] as const,
    directorySummary: (branchId?: string) =>
      ["patients", "directory-summary", branchId] as const,
    activeServices: (patientId: string) => ["patients", "active-services", patientId] as const,
  },
  services: {
    all: ["services"] as const,
    list: (params?: object) => ["services", "list", params] as const,
  },
  branches: {
    all: ["branches"] as const,
    overview: ["branches", "overview"] as const,
  },
  payments: {
    all: ["payments"] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (params?: object) => ["transactions", "list", params] as const,
    summary: (branchId?: string) => ["transactions", "summary", branchId] as const,
  },
  duePayments: {
    all: ["due-payments"] as const,
    list: (params?: object) => ["due-payments", "list", params] as const,
    summary: (branchId?: string) => ["due-payments", "summary", branchId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (params?: object) => ["expenses", "list", params] as const,
    summary: (branchId?: string) => ["expenses", "summary", branchId] as const,
  },
  dailyClosing: {
    all: ["daily-closing"] as const,
    todaySummary: (branchId?: string) => ["daily-closing", "today-summary", branchId] as const,
    history: (branchId?: string) => ["daily-closing", "history", branchId] as const,
  },
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
};
