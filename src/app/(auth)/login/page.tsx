"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Info } from "lucide-react";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <Image
        src="/dashboardImage.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image
            src="/logo.png"
            alt="Speech Therapy Lab"
            width={56}
            height={56}
            className="rounded-full shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_16px_rgba(15,23,42,0.12)]"
            priority
          />
          <p className="text-sm font-semibold text-text-primary">Speech Therapy Lab</p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/90 p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_rgba(15,23,42,0.04),0_24px_48px_rgba(15,23,42,0.14)] backdrop-blur-md sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
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
          </form>
        </div>

        <div className="mt-5 rounded-xl border border-white/60 bg-white/90 px-4 py-3 text-xs text-text-secondary shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur-md">
          <p className="flex items-center gap-1.5 font-medium text-text-primary">
            <Info className="h-3.5 w-3.5 text-primary" />
            Demo access
          </p>
          <p className="mt-1.5 font-mono">admin@speechlab.test / admin123</p>
          <p className="font-mono">manager@speechlab.test / manager123</p>
        </div>
      </div>
    </main>
  );
}
