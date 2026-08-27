import type { AuthUser } from "@/types/domain";

/**
 * Mock implementation — matches the exact shape/signature this module will have
 * once it calls the real Django/DRF auth endpoints (see README "API Integration Layer").
 * Swap the body of each function for a real `apiClient` call later; callers never change.
 */

const MOCK_USERS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: "admin@speechlab.test",
    password: "admin123",
    user: {
      id: "u-admin-1",
      name: "Admin User",
      email: "admin@speechlab.test",
      role: "admin",
      branchId: null,
    },
  },
  {
    email: "manager@speechlab.test",
    password: "manager123",
    user: {
      id: "u-manager-1",
      name: "Branch Manager",
      email: "manager@speechlab.test",
      role: "manager",
      branchId: "branch-1",
    },
  },
];

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string }> {
  const match = MOCK_USERS.find(
    (u) => u.email === input.email && u.password === input.password,
  );
  await delay(null, 400);
  if (!match) {
    throw { message: "Invalid email or password." };
  }
  return { user: match.user, accessToken: `mock-token-${match.user.id}` };
}

export async function logout(): Promise<void> {
  return delay(undefined, 150);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return delay(null, 150);
}
