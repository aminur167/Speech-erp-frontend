import type { AuthUser } from "@/types/domain";

/**
 * Mock implementation — matches the exact shape/signature this module will have
 * once it calls the real Django/DRF auth endpoints (see README "API Integration Layer").
 * Swap the body of each function for a real `apiClient` call later; callers never change.
 */

let MOCK_USERS: Array<{ email: string; password: string; user: AuthUser }> = [
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
      name: "Farhana Rahman",
      email: "manager@speechlab.test",
      role: "manager",
      branchId: "branch-1",
    },
  },
  {
    email: "manager.ctg@speechlab.test",
    password: "manager123",
    user: {
      id: "u-manager-2",
      name: "Nusrat Jahan",
      email: "manager.ctg@speechlab.test",
      role: "manager",
      branchId: "branch-2",
    },
  },
  {
    email: "manager.syl@speechlab.test",
    password: "manager123",
    user: {
      id: "u-manager-3",
      name: "Imran Hossain",
      email: "manager.syl@speechlab.test",
      role: "manager",
      branchId: "branch-3",
    },
  },
  {
    email: "manager.ran@speechlab.test",
    password: "manager123",
    user: {
      id: "u-manager-4",
      name: "Kamrul Hasan",
      email: "manager.ran@speechlab.test",
      role: "manager",
      branchId: "branch-4",
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

export interface UpdateProfileInput {
  userId: string;
  name: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  await delay(null, 300);
  const match = MOCK_USERS.find((u) => u.user.id === input.userId);
  if (!match) {
    throw { message: "User not found.", status: 404 };
  }
  match.user = { ...match.user, name: input.name };
  return match.user;
}

export interface UpsertManagerAccountInput {
  branchId: string;
  managerName: string;
  email: string;
  password: string;
}

/**
 * Provisions or updates the manager login for a branch — called by branches.ts whenever
 * Admin creates or edits a branch. A real backend would do this server-side as part of the
 * same request; here it's a second in-memory store kept in sync explicitly.
 */
export async function upsertManagerAccount(input: UpsertManagerAccountInput): Promise<void> {
  await delay(null, 100);
  const index = MOCK_USERS.findIndex(
    (u) => u.user.role === "manager" && u.user.branchId === input.branchId,
  );
  const account = {
    email: input.email,
    password: input.password,
    user: {
      id: index >= 0 ? MOCK_USERS[index].user.id : `u-manager-${Date.now()}`,
      name: input.managerName,
      email: input.email,
      role: "manager" as const,
      branchId: input.branchId,
    },
  };
  MOCK_USERS =
    index >= 0
      ? MOCK_USERS.map((u, i) => (i === index ? account : u))
      : [...MOCK_USERS, account];
}
