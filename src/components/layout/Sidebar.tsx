"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { clsx } from "clsx";
import { isNavGroup, type NavGroup, type NavItem } from "@/config/navigation";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useBranches } from "@/hooks/branches/useBranches";

function collectHrefs(items: NavItem[]): string[] {
  return items.flatMap((item) => (isNavGroup(item) ? item.children.map((child) => child.href) : item.href));
}

/** Of all nav hrefs, the longest one that matches the current path "wins" — so a more specific route (e.g. /materials/sell) doesn't also light up its parent (/materials). */
function findActiveHref(pathname: string, hrefs: string[]): string | undefined {
  const matches = hrefs.filter((href) => pathname === href || pathname.startsWith(`${href}/`));
  return matches.sort((a, b) => b.length - a.length)[0];
}

function NavLinkRow({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: NavItem["icon"];
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={clsx(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary-light text-primary-dark"
          : "text-text-secondary hover:bg-primary-light/60 hover:text-text-primary",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function NavGroupRow({
  item,
  activeHref,
  collapsed,
  onExpandSidebar,
  onNavigate,
}: {
  item: NavGroup;
  activeHref: string | undefined;
  collapsed: boolean;
  onExpandSidebar: () => void;
  onNavigate: () => void;
}) {
  const groupIsActive = item.children.some((child) => child.href === activeHref);
  const [isOpen, setIsOpen] = useState(groupIsActive);
  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={() => (collapsed ? onExpandSidebar() : setIsOpen((prev) => !prev))}
        className={clsx(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          groupIsActive
            ? "text-primary-dark"
            : "text-text-secondary hover:bg-primary-light/60 hover:text-text-primary",
        )}
      >
        {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              className={clsx("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
            />
          </>
        )}
      </button>
      {!collapsed && isOpen && (
        <div className="mt-1 flex flex-col gap-1 border-l border-border pl-6">
          {item.children.map((child) => (
            <NavLinkRow
              key={child.href}
              href={child.href}
              label={child.label}
              active={child.href === activeHref}
              collapsed={false}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const isMobileOpen = useUiStore((state) => state.isMobileSidebarOpen);
  const toggleCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);
  const expandSidebar = useUiStore((state) => state.expandSidebar);
  const closeMobileSidebar = useUiStore((state) => state.closeMobileSidebar);
  const activeHref = findActiveHref(pathname, collectHrefs(items));

  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "manager";
  const { data: branches } = useBranches(isManager);
  const branchName = isManager ? branches?.find((b) => b.id === user?.branchId)?.name : undefined;

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[1px] md:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-surface transition-all duration-200 md:translate-x-0",
          isCollapsed ? "md:w-[68px]" : "md:w-64",
          "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={clsx(
            "flex h-16 shrink-0 items-center gap-2.5 border-b border-border",
            isCollapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <Image
            src="/logo.png"
            alt="Therapy Lab"
            width={36}
            height={36}
            className="shrink-0 rounded-full"
            priority
          />
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="block truncate text-base font-semibold leading-tight text-primary-dark">
                Speech Therapy Lab
              </span>
              {branchName && (
                <span className="block truncate text-xs font-medium leading-tight text-text-secondary">
                  {branchName}
                </span>
              )}
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) =>
            isNavGroup(item) ? (
              <NavGroupRow
                key={item.label}
                item={item}
                activeHref={activeHref}
                collapsed={isCollapsed}
                onExpandSidebar={expandSidebar}
                onNavigate={closeMobileSidebar}
              />
            ) : (
              <NavLinkRow
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={item.href === activeHref}
                collapsed={isCollapsed}
                onNavigate={closeMobileSidebar}
              />
            ),
          )}
        </nav>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden shrink-0 items-center gap-2 border-t border-border px-5 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-light/60 hover:text-text-primary md:flex"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}
