"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-text-secondary capitalize">Role: {user.role}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </div>

        <Card>
          <h2 className="text-sm font-medium text-text-secondary">
            Design system preview
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status="paid" />
            <StatusBadge status="due" />
            <StatusBadge status="upcoming" />
            <StatusBadge status="partial" />
            <StatusBadge status="cancelled" />
            <StatusBadge status="refunded" />
            <StatusBadge status="void" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="accent">Accent (Collect Payment)</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
