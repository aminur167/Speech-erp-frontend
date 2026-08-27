import { getPatientDirectorySummary } from "@/lib/api/patientDirectory";
import { getTransactionsSummary } from "@/lib/api/transactions";
import { upsertManagerAccount } from "@/lib/api/auth";
import type { Branch } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/branches/` endpoints.
 */

let branches: Branch[] = [
  {
    id: "branch-1",
    name: "Dhaka Main Branch",
    code: "BR-DHK-001",
    status: "active",
    address: "House 42, Road 8, Dhanmondi R/A, Dhaka 1209",
    phone: "+880 2-9611230",
    managerName: "Farhana Rahman",
    managerCode: "MGR-DHK-001",
    managerEmail: "manager@speechlab.test",
    managerPassword: "manager123",
    therapistCount: 18,
    supportCount: 8,
    openedAt: "2023-02-10",
  },
  {
    id: "branch-2",
    name: "Chattogram Branch",
    code: "BR-CTG-001",
    status: "active",
    address: "GEC Circle, 1259 CDA Avenue, Chattogram 4000",
    phone: "+880 31-2556710",
    managerName: "Nusrat Jahan",
    managerCode: "MGR-CTG-001",
    managerEmail: "manager.ctg@speechlab.test",
    managerPassword: "manager123",
    therapistCount: 12,
    supportCount: 6,
    openedAt: "2023-12-19",
  },
  {
    id: "branch-3",
    name: "Sylhet Branch",
    code: "BR-SYL-001",
    status: "active",
    address: "Zindabazar, Sylhet 3100",
    phone: "+880 821-715522",
    managerName: "Imran Hossain",
    managerCode: "MGR-SYL-001",
    managerEmail: "manager.syl@speechlab.test",
    managerPassword: "manager123",
    therapistCount: 9,
    supportCount: 4,
    openedAt: "2024-06-01",
  },
  {
    id: "branch-4",
    name: "Rangpur Branch",
    code: "BR-RAN-001",
    status: "inactive",
    address: "Station Road, Rangpur 5400",
    phone: "+880 521-63340",
    managerName: "Kamrul Hasan",
    managerCode: "MGR-RAN-001",
    managerEmail: "manager.ran@speechlab.test",
    managerPassword: "manager123",
    therapistCount: 0,
    supportCount: 0,
    openedAt: "2025-01-15",
  },
];

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function listBranches(): Promise<Branch[]> {
  await delay(null);
  return branches;
}

export interface BranchInput {
  name: string;
  code: string;
  status: Branch["status"];
  address: string;
  phone: string;
  managerName: string;
  managerCode: string;
  managerEmail: string;
  /** Required when creating a branch; leave blank on edit to keep the current password. */
  managerPassword?: string;
  therapistCount: number;
  supportCount: number;
  openedAt: string;
}

export async function createBranch(input: BranchInput): Promise<Branch> {
  await delay(null);
  const newBranch: Branch = {
    id: `branch-${Date.now()}`,
    ...input,
    managerPassword: input.managerPassword ?? "",
  };
  branches = [...branches, newBranch];
  await upsertManagerAccount({
    branchId: newBranch.id,
    managerName: newBranch.managerName,
    email: newBranch.managerEmail,
    password: newBranch.managerPassword,
  });
  return newBranch;
}

export async function updateBranch(id: string, input: BranchInput): Promise<Branch> {
  await delay(null);
  const index = branches.findIndex((b) => b.id === id);
  if (index === -1) {
    throw { message: "Branch not found.", status: 404 };
  }
  const existing = branches[index];
  const updated: Branch = {
    ...existing,
    ...input,
    managerPassword: input.managerPassword || existing.managerPassword,
  };
  branches = branches.map((b) => (b.id === id ? updated : b));
  await upsertManagerAccount({
    branchId: updated.id,
    managerName: updated.managerName,
    email: updated.managerEmail,
    password: updated.managerPassword,
  });
  return updated;
}

export interface BranchOverview {
  branch: Branch;
  patientCount: number;
  totalCollected: number;
  monthlyRevenue: number;
}

export async function getBranchesOverview(): Promise<BranchOverview[]> {
  return Promise.all(
    branches.map(async (branch) => {
      const [patients, transactions] = await Promise.all([
        getPatientDirectorySummary(branch.id),
        getTransactionsSummary(branch.id),
      ]);
      return {
        branch,
        patientCount: patients.total,
        totalCollected: transactions.totalCollected,
        monthlyRevenue: transactions.monthCollected,
      };
    }),
  );
}
