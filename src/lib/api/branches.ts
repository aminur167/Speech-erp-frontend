import { getPatientDirectorySummary } from "@/lib/api/patientDirectory";
import { getTransactionsSummary } from "@/lib/api/transactions";
import type { Branch } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/branches/` endpoints.
 */

const branches: Branch[] = [
  {
    id: "branch-1",
    name: "Dhaka Main Branch",
    code: "BR-DHK-001",
    status: "active",
    address: "House 42, Road 8, Dhanmondi R/A, Dhaka 1209",
    phone: "+880 2-9611230",
    managerName: "Farhana Rahman",
    managerCode: "MGR-DHK-001",
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
