"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Building2, Users, Wallet, ShieldCheck } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const currentUser = useAuthStore((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="relative hidden w-[55%] shrink-0 overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-hover lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-1.5 backdrop-blur-sm">
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
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white xl:text-4xl">
            Everything your clinic needs, in one place.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
            Manage patients, packages, payments and every branch from a single,
            real-time dashboard built for modern speech therapy clinics.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <feature.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-white/90">{feature.label}</span>
              </div>
            ))}
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
            <h1 className="text-2xl font-semibold text-text-primary">Welcome back</h1>
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

            <Button type="submit" isLoading={loginMutation.isPending} className="mt-2">
              Sign In
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
