"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { isNavGroup, type NavGroup, type NavItem } from "@/config/navigation";
import { useUiStore } from "@/store/uiStore";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinkRow({ href, label, icon: Icon, active }: {
  href: string;
  label: string;
  icon?: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-light text-primary-dark"
          : "text-text-secondary hover:bg-primary-light/50 hover:text-text-primary",
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </Link>
  );
}

function NavGroupRow({ item, pathname }: { item: NavGroup; pathname: string }) {
  const groupIsActive = item.children.some((child) => isActive(pathname, child.href));
  const [isOpen, setIsOpen] = useState(groupIsActive);
  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          groupIsActive
            ? "text-primary-dark"
            : "text-text-secondary hover:bg-primary-light/50 hover:text-text-primary",
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={clsx("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && (
        <div className="mt-1 flex flex-col gap-1 border-l border-border pl-6">
          {item.children.map((child) => (
            <NavLinkRow
              key={child.href}
              href={child.href}
              label={child.label}
              active={isActive(pathname, child.href)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => useUiStore.getState().toggleSidebar()}
        />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface transition-transform md:static md:z-auto md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-5">
          <span className="text-base font-semibold text-primary-dark">
            Speech Therapy Lab
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) =>
            isNavGroup(item) ? (
              <NavGroupRow key={item.label} item={item} pathname={pathname} />
            ) : (
              <NavLinkRow
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(pathname, item.href)}
              />
            ),
          )}
        </nav>
      </aside>
    </>
  );
}
