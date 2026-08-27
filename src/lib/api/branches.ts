import { getPatientDirectorySummary } from "@/lib/api/patientDirectory";
import { getTransactionsSummary } from "@/lib/api/transactions";
import type { Branch } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/branches/` endpoints.
 */

const branches: Branch[] = [
  { id: "branch-1", name: "Dhaka Main Branch" },
  { id: "branch-2", name: "Chattogram Branch" },
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
      };
    }),
  );
}
