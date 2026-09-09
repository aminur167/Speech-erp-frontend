export const queryKeys = {
  patientAttendance: {
    all: ["patient-attendance"] as const,
    roster: (params?: object) => ["patient-attendance", "roster", params] as const,
    history: (patientId: string) =>
      ["patient-attendance", "history", patientId] as const,
  },
  patients: {
    all: ["patients"] as const,
    list: (params?: object) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
    directory: (params?: object) => ["patients", "directory", params] as const,
    directorySummary: (branchId?: string, date?: string) =>
      ["patients", "directory-summary", branchId, date] as const,
    activeServices: (patientId: string) => ["patients", "active-services", patientId] as const,
    outstandingDues: (patientId: string) =>
      ["patients", "outstanding-dues", patientId] as const,
  },
  services: {
    all: ["services"] as const,
    list: (params?: object) => ["services", "list", params] as const,
    enrollmentCounts: ["services", "enrollment-counts"] as const,
  },
  branches: {
    all: ["branches"] as const,
    list: ["branches", "list"] as const,
    overview: ["branches", "overview"] as const,
    overviewOne: (id: string) => ["branches", "overview", id] as const,
  },
  payments: {
    all: ["payments"] as const,
  },
  refundRequests: {
    all: ["refund-requests"] as const,
    list: (params?: object) => ["refund-requests", "list", params] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (params?: object) => ["transactions", "list", params] as const,
    summary: (branchId?: string, date?: string) =>
      ["transactions", "summary", branchId, date] as const,
    refundsAndVoids: (branchId?: string) =>
      ["transactions", "refunds-voids", branchId] as const,
    trend: (branchId: string | undefined, days: number) =>
      ["transactions", "trend", branchId, days] as const,
    byMethodThisMonth: (branchId?: string) =>
      ["transactions", "by-method-month", branchId] as const,
    byCategoryThisMonth: (branchId?: string) =>
      ["transactions", "by-category-month", branchId] as const,
    dashboardMetrics: (branchId?: string, date?: string) =>
      ["transactions", "dashboard-metrics", branchId, date] as const,
    branchSummary: (branchId?: string, dateFrom?: string, dateTo?: string) =>
      ["transactions", "branch-summary", branchId, dateFrom, dateTo] as const,
    branchDailyLedger: (branchId?: string, dateFrom?: string, dateTo?: string) =>
      ["transactions", "branch-summary", "daily", branchId, dateFrom, dateTo] as const,
    collectionForDate: (branchId: string | undefined, date: string) =>
      ["transactions", "collection-for-date", branchId, date] as const,
  },
  duePayments: {
    all: ["due-payments"] as const,
    list: (params?: object) => ["due-payments", "list", params] as const,
    summary: (branchId?: string, date?: string) =>
      ["due-payments", "summary", branchId, date] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (params?: object) => ["expenses", "list", params] as const,
    summary: (branchId?: string, date?: string) =>
      ["expenses", "summary", branchId, date] as const,
    totalForDate: (branchId: string | undefined, date: string) =>
      ["expenses", "total-for-date", branchId, date] as const,
  },
  dailyClosing: {
    all: ["daily-closing"] as const,
    todaySummary: (branchId?: string, date?: string) =>
      ["daily-closing", "today-summary", branchId, date] as const,
    history: (branchId?: string) => ["daily-closing", "history", branchId] as const,
    list: (params?: object) => ["daily-closing", "list", params] as const,
  },
  materials: {
    all: ["materials"] as const,
    list: (branchId?: string) => ["materials", "list", branchId] as const,
    summary: (branchId?: string) => ["materials", "summary", branchId] as const,
    movements: (materialId: string) => ["materials", "movements", materialId] as const,
  },
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (params?: object) => ["bookings", "list", params] as const,
  },
  auditLogs: {
    all: ["audit-logs"] as const,
    list: (params?: object) => ["audit-logs", "list", params] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: object) => ["notifications", "list", params] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  pendingPackages: {
    count: ["pending-packages", "count"] as const,
  },
  staff: {
    all: ["staff"] as const,
    list: (branchId?: string) => ["staff", "list", branchId] as const,
    summary: (branchId?: string) => ["staff", "summary", branchId] as const,
    todayAttendance: (branchId?: string) => ["staff", "today-attendance", branchId] as const,
    attendanceHistory: (staffId: string, month: string) =>
      ["staff", "attendance-history", staffId, month] as const,
    /** Prefix key for invalidating every month's history at once. */
    attendanceHistoryAll: (staffId: string) => ["staff", "attendance-history", staffId] as const,
    bonuses: (staffId: string) => ["staff", "bonuses", staffId] as const,
    monthlyReport: (branchId?: string, month?: string) =>
      ["staff", "monthly-report", branchId, month] as const,
  },
  salaryPayments: {
    all: ["salary-payments"] as const,
    list: (params?: object) => ["salary-payments", "list", params] as const,
    branchSummary: (month?: string) => ["salary-payments", "branch-summary", month] as const,
    pendingCount: ["salary-payments", "pending-count"] as const,
  },
};
