"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

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
      router.push("/dashboard");
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-text-primary">Speech Therapy Lab</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in to your account</p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        >
          <Input
            type="email"
            placeholder="Email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            type="password"
            placeholder="Password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" isLoading={loginMutation.isPending}>
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-xs text-text-secondary">
          Demo: admin@speechlab.test / admin123 or manager@speechlab.test / manager123
        </p>
      </Card>
    </main>
  );
}
