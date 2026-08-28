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
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { dashboardPathForRole } from "@/hooks/useAuthGuard";
import { formatCurrency } from "@/utils/currency";

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

const PREVIEW_BARS = [40, 65, 50, 80, 60, 95, 75];

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
          backgroundColor: "#134e4a",
          backgroundImage: [
            "radial-gradient(ellipse 80% 60% at 15% 0%, rgba(45,212,191,0.35), transparent 60%)",
            "radial-gradient(ellipse 70% 60% at 100% 100%, rgba(249,115,22,0.22), transparent 55%)",
            "linear-gradient(135deg, #134e4a 0%, #0f766e 55%, #0d9488 100%)",
          ].join(", "),
        }}
      >
        {/* Subtle dot-grid texture for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/25 blur-3xl"
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-1.5 shadow-lg shadow-black/10 ring-1 ring-white/20 backdrop-blur-sm">
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
            <p className="text-base font-semibold text-white">Speech Therapy Lab</p>
            <p className="text-xs text-white/70">Perfect Therapeutic Medicine</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="max-w-md text-3xl font-semibold leading-[1.15] tracking-tight text-white xl:text-[2.75rem]">
            Everything your clinic needs,{" "}
            <span className="bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent">
              in one place.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
            Manage patients, packages, payments and every branch from a single,
            real-time dashboard built for modern speech therapy clinics.
          </p>

          <div className="mt-9 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/10">
                  <feature.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-white/90">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Illustrative live-dashboard preview card */}
          <div className="mt-9 w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 text-white">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-medium text-white/80">Today&apos;s Collection</span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                Live
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(2300)}</p>
            <div className="mt-3 flex items-end gap-1.5">
              {PREVIEW_BARS.map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-sm bg-gradient-to-t from-emerald-300/40 to-emerald-200/80"
                  style={{ height: `${height * 0.32}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} Speech Therapy Lab. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 text-center lg:hidden">
            <Image src="/logo.png" alt="Speech Therapy Lab" width={56} height={56} priority />
            <p className="text-sm font-semibold text-text-primary">Speech Therapy Lab</p>
          </div>

          <div className="mt-8 lg:mt-0">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to manage your branch and patients.
            </p>
          </div>

          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
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
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
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

            <Button
              type="submit"
              isLoading={loginMutation.isPending}
              className="group mt-2"
            >
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-secondary">
            <p className="font-medium text-text-primary">Demo access</p>
            <p className="mt-1.5 font-mono">admin@speechlab.test / admin123</p>
            <p className="font-mono">manager@speechlab.test / manager123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
