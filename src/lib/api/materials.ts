import { createPayment } from "@/lib/api/payments";
import type { Material, MaterialMovement, MaterialMovementType, MaterialUnit, Payment, PaymentMethod } from "@/types/domain";

/**
 * Mock implementation — matches the shape/signature this module will have
 * once it calls the real Django/DRF `/materials/` endpoints. Materials and
 * their stock levels are tracked per branch (unlike the shared Service
 * catalog), since physical inventory doesn't move between branches.
 */

let mockMaterials: Material[] = [
  { id: "mat-1", name: "Flashcards Set", code: "MAT-00001", unit: "packet", quantity: 20, unitCost: 250, sellingPrice: 350, reorderLevel: 5, branchId: "branch-1", createdAt: "2026-06-01T09:00:00Z" },
  { id: "mat-2", name: "Speech Therapy Toys", code: "MAT-00002", unit: "set", quantity: 15, unitCost: 500, sellingPrice: 700, reorderLevel: 4, branchId: "branch-1", createdAt: "2026-06-01T09:00:00Z" },
  { id: "mat-3", name: "Assessment Kit", code: "MAT-00003", unit: "set", quantity: 5, unitCost: 2000, sellingPrice: 2500, reorderLevel: 3, branchId: "branch-1", createdAt: "2026-06-15T09:00:00Z" },
  { id: "mat-4", name: "Stationery Pack", code: "MAT-00004", unit: "packet", quantity: 2, unitCost: 150, sellingPrice: 220, reorderLevel: 5, branchId: "branch-1", createdAt: "2026-07-01T09:00:00Z" },
  { id: "mat-5", name: "Hand Sanitizer", code: "MAT-00005", unit: "bottle", quantity: 30, unitCost: 120, sellingPrice: 180, reorderLevel: 10, branchId: "branch-1", createdAt: "2026-07-10T09:00:00Z" },
];

let mockMovements: MaterialMovement[] = [];
let sequence = mockMaterials.length;

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generateMaterialCode(): string {
  sequence += 1;
  return `MAT-${String(sequence).padStart(5, "0")}`;
}

export async function listMaterials(branchId?: string): Promise<Material[]> {
  await delay(null);
  return branchId ? mockMaterials.filter((m) => m.branchId === branchId) : mockMaterials;
}

export interface MaterialsSummary {
  totalItems: number;
  totalStockValue: number;
  lowStockCount: number;
}

export async function getMaterialsSummary(branchId?: string): Promise<MaterialsSummary> {
  const materials = await listMaterials(branchId);
  return {
    totalItems: materials.length,
    totalStockValue: materials.reduce((sum, m) => sum + m.quantity * m.unitCost, 0),
    lowStockCount: materials.filter((m) => m.quantity <= m.reorderLevel).length,
  };
}

export interface MaterialInput {
  name: string;
  unit: MaterialUnit;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  reorderLevel: number;
  branchId: string;
}

export async function createMaterial(input: MaterialInput): Promise<Material> {
  await delay(null);
  const newMaterial: Material = {
    id: `mat-${Date.now()}`,
    code: generateMaterialCode(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  mockMaterials = [...mockMaterials, newMaterial];
  return newMaterial;
}

export async function updateMaterial(id: string, input: MaterialInput): Promise<Material> {
  await delay(null);
  const index = mockMaterials.findIndex((m) => m.id === id);
  if (index === -1) {
    throw { message: "Material not found.", status: 404 };
  }
  const updated: Material = { ...mockMaterials[index], ...input };
  mockMaterials = mockMaterials.map((m) => (m.id === id ? updated : m));
  return updated;
}

export async function deleteMaterial(id: string): Promise<void> {
  await delay(null, 200);
  mockMaterials = mockMaterials.filter((m) => m.id !== id);
}

export interface AdjustStockInput {
  materialId: string;
  type: MaterialMovementType;
  quantity: number;
  note?: string;
  branchId: string;
  createdBy: string;
}

export async function adjustStock(input: AdjustStockInput): Promise<Material> {
  await delay(null, 250);
  const index = mockMaterials.findIndex((m) => m.id === input.materialId);
  if (index === -1) {
    throw { message: "Material not found.", status: 404 };
  }
  const material = mockMaterials[index];
  const delta = input.type === "in" ? input.quantity : -input.quantity;
  const nextQuantity = material.quantity + delta;
  if (nextQuantity < 0) {
    throw { message: "Not enough stock for this adjustment.", status: 400 };
  }

  const updated: Material = { ...material, quantity: nextQuantity };
  mockMaterials = mockMaterials.map((m) => (m.id === input.materialId ? updated : m));

  mockMovements = [
    {
      id: `mov-${Date.now()}`,
      materialId: input.materialId,
      type: input.type,
      quantity: input.quantity,
      note: input.note,
      branchId: input.branchId,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    },
    ...mockMovements,
  ];

  return updated;
}

export async function listMaterialMovements(materialId: string): Promise<MaterialMovement[]> {
  await delay(null, 150);
  return mockMovements
    .filter((m) => m.materialId === materialId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export interface SellMaterialsCartItem {
  materialId: string;
  quantity: number;
  unitPrice: number;
}

export interface SellMaterialsInput {
  items: SellMaterialsCartItem[];
  patientId: string;
  method: PaymentMethod;
  branchId: string;
  createdBy: string;
}

export interface MaterialsSaleResult {
  materials: Material[];
  payment: Payment;
}

/** Sells a cart of materials to a patient in one checkout: deducts inventory, logs a movement per line, and creates a single Payment so it flows into revenue reporting. */
export async function sellMaterials(input: SellMaterialsInput): Promise<MaterialsSaleResult> {
  await delay(null, 300);
  if (input.items.length === 0) {
    throw { message: "Cart is empty.", status: 400 };
  }

  const updated = new Map<string, Material>();
  for (const item of input.items) {
    const material = mockMaterials.find((m) => m.id === item.materialId);
    if (!material) {
      throw { message: "Material not found.", status: 404 };
    }
    const nextQuantity = material.quantity - item.quantity;
    if (nextQuantity < 0) {
      throw { message: `Not enough stock for "${material.name}".`, status: 400 };
    }
    updated.set(item.materialId, { ...material, quantity: nextQuantity });
  }

  const amount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const payment = await createPayment({
    patientId: input.patientId,
    amount,
    method: input.method,
    category: "material_sale",
    collectedBy: input.createdBy,
    branchId: input.branchId,
  });

  mockMaterials = mockMaterials.map((m) => updated.get(m.id) ?? m);

  mockMovements = [
    ...input.items.map((item) => ({
      id: `mov-${Date.now()}-${item.materialId}`,
      materialId: item.materialId,
      type: "out" as MaterialMovementType,
      quantity: item.quantity,
      note: `Sold — Payment ${payment.receiptNumber}`,
      branchId: input.branchId,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    })),
    ...mockMovements,
  ];

  return { materials: Array.from(updated.values()), payment };
}
