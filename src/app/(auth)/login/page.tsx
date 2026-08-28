"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Users,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Info,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { dashboardPathForRole } from "@/hooks/useAuthGuard";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Building2, label: "Manage every branch from one dashboard" },
  { icon: Users, label: "Complete patient & therapy records" },
  { icon: Wallet, label: "Real-time billing and collections" },
  { icon: ShieldCheck, label: "Role-based access for Admin and Managers" },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Role-based access control" },
  { icon: Building2, label: "Built for multi-branch clinics" },
  { icon: Zap, label: "Real-time, always in sync" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const currentUser = useAuthStore((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotNote, setShowForgotNote] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.replace(dashboardPathForRole(currentUser.role));
    }
  }, [currentUser, router]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, accessToken }) => {
      login(user, accessToken);
      router.push(dashboardPathForRole(user.role));
    },
    onError: (error: { message: string; fieldErrors?: Record<string, string[]> }) => {
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof LoginFormValues, { message: messages[0] });
        });
      } else {
        setError("password", { message: error.message });
      }
    },
  });

  return (
    <main className="flex min-h-screen bg-background">
      {/* Branding panel — hidden on small screens, form takes the full width there */}
      <div
        className="relative hidden w-[55%] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        style={{
          backgroundColor: "#f0fdfa",
          backgroundImage: [
            "radial-gradient(ellipse 70% 55% at 10% 0%, rgba(204,251,241,0.9), transparent 60%)",
            "radial-gradient(ellipse 60% 55% at 100% 100%, rgba(249,115,22,0.08), transparent 55%)",
            "linear-gradient(135deg, #f8fafc 0%, #f0fdfa 55%, #ecfeff 100%)",
          ].join(", "),
        }}
      >
        {/* Subtle dot-grid texture for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(15,118,110,0.18) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
            <Image
              src="/logo.png"
              alt="Speech Therapy Lab"
              width={40}
              height={40}
              className="rounded-full"
              priority
            />
          </span>
          <div>
            <p className="text-base font-semibold text-text-primary">Speech Therapy Lab</p>
            <p className="text-xs text-text-secondary">Perfect Therapeutic Medicine</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="max-w-md text-3xl font-semibold leading-[1.15] tracking-tight text-text-primary xl:text-[2.75rem]">
            Everything your clinic needs,{" "}
            <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              in one place.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-text-secondary">
            Manage patients, packages, payments and every branch from a single,
            real-time dashboard built for modern speech therapy clinics.
          </p>

          <div className="mt-9 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm ring-1 ring-black/5">
                  <feature.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-text-primary">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/5 pt-6">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge.label}
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary"
              >
                <badge.icon className="h-3.5 w-3.5 text-primary" />
                {badge.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} Speech Therapy Lab. All rights reserved.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 text-center lg:hidden">
            <Image src="/logo.png" alt="Speech Therapy Lab" width={56} height={56} priority />
            <p className="text-sm font-semibold text-text-primary">Speech Therapy Lab</p>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_rgba(15,23,42,0.04),0_24px_48px_rgba(15,23,42,0.10)] sm:p-10 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Sign In
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to manage your branch and patients.
            </p>

            <form
              className="mt-7 flex flex-col gap-4"
              onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Email
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary" />
                  <Input
                    type="email"
                    placeholder="you@speechlab.test"
                    error={errors.email?.message}
                    className="pl-9"
                    {...register("email")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Password
                </label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    error={errors.password?.message}
                    className="pl-9 pr-9"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex select-none items-center gap-2 text-xs text-text-secondary">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNote((prev) => !prev)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {showForgotNote && (
                <p className="-mt-2 rounded-lg bg-primary-light/60 px-3 py-2 text-xs text-primary-dark">
                  Password resets are handled by your organization administrator.
                </p>
              )}

              <Button type="submit" isLoading={loginMutation.isPending} className="group mt-2">
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-text-secondary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Protected by role-based access control
              </p>
            </form>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-text-secondary">
            <p className="flex items-center gap-1.5 font-medium text-text-primary">
              <Info className="h-3.5 w-3.5 text-primary" />
              Demo access
            </p>
            <p className="mt-1.5 font-mono">admin@speechlab.test / admin123</p>
            <p className="font-mono">manager@speechlab.test / manager123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
