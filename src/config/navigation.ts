import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Settings,
  UserPlus,
  Wallet,
  BarChart3,
  CalendarCheck,
  Receipt,
  History,
  Package,
  Boxes,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon?: LucideIcon;
  children: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export const managerNav: NavItem[] = [
  { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/manager/patients", icon: UserPlus },
  { label: "Packages", href: "/manager/packages", icon: Package },
  { label: "Materials", href: "/manager/materials", icon: Boxes },
  {
    label: "Enroll Service",
    icon: ClipboardList,
    children: [
      { label: "Daily Services", href: "/manager/services/daily" },
      { label: "Monthly Services", href: "/manager/services/monthly" },
      { label: "Installment Services", href: "/manager/services/installment" },
      { label: "Online Services", href: "/manager/services/online" },
    ],
  },
  { label: "Due Payment Collection", href: "/manager/due-payments", icon: Wallet },
  { label: "Expenses", href: "/manager/expenses", icon: Receipt },
  { label: "Transactions", href: "/manager/transactions", icon: History },
  { label: "Daily Closing", href: "/manager/daily-closing", icon: CalendarCheck },
  { label: "Settings", href: "/manager/settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Branches", href: "/admin/branches", icon: Building2 },
  { label: "Patients", href: "/admin/patients", icon: UserPlus },
  { label: "Services", href: "/admin/services", icon: ClipboardList },
  { label: "Expenses", href: "/admin/expenses", icon: Receipt },
  { label: "Transactions", href: "/admin/transactions", icon: History },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
