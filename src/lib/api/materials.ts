import { apiClient } from "@/lib/api/client";
import { toSnakeCase } from "@/lib/api/caseUtils";
import { normalizePayment, type RawPayment } from "@/lib/api/payments";
import type { PaginatedResponse } from "@/types/api";
import type { Material, MaterialMovement, MaterialMovementType, MaterialUnit, Payment, PaymentMethod } from "@/types/domain";

// `unitCost`/`sellingPrice` are real DRF DecimalFields, so they cross the
// wire as JSON strings (COERCE_DECIMAL_TO_STRING) -- normalized here too,
// same as the id field.
interface RawMaterial extends Omit<Material, "id" | "unitCost" | "sellingPrice"> {
  id: number | string;
  unitCost: number | string;
  sellingPrice: number | string;
}
function normalizeMaterial(raw: RawMaterial): Material {
  return {
    ...raw,
    id: String(raw.id),
    unitCost: Number(raw.unitCost),
    sellingPrice: Number(raw.sellingPrice),
  };
}

interface RawMovement extends Omit<MaterialMovement, "id" | "materialId"> {
  id: number | string;
}
function normalizeMovement(raw: RawMovement, materialId: string): MaterialMovement {
  return { ...raw, id: String(raw.id), materialId };
}

export async function listMaterials(branchId?: string): Promise<Material[]> {
  const { data } = await apiClient.get<PaginatedResponse<RawMaterial>>("/materials/", {
    params: { branch: branchId, pageSize: 500 },
  });
  return data.results.map(normalizeMaterial);
}

export interface MaterialsSummary {
  totalItems: number;
  totalStockValue: number;
  lowStockCount: number;
}

interface RawMaterialsSummary extends Omit<MaterialsSummary, "totalStockValue"> {
  totalStockValue: number | string;
}

export async function getMaterialsSummary(branchId?: string): Promise<MaterialsSummary> {
  const { data } = await apiClient.get<RawMaterialsSummary>("/materials/summary/", {
    params: { branch: branchId },
  });
  return { ...data, totalStockValue: Number(data.totalStockValue) };
}

export interface MaterialInput {
  name: string;
  imageUrl?: string;
  unit: MaterialUnit;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  reorderLevel: number;
}

export async function createMaterial(input: MaterialInput): Promise<Material> {
  const { data } = await apiClient.post<RawMaterial>("/materials/", toSnakeCase(input));
  return normalizeMaterial(data);
}

export async function updateMaterial(id: string, input: MaterialInput): Promise<Material> {
  const { data } = await apiClient.put<RawMaterial>(`/materials/${id}/`, toSnakeCase(input));
  return normalizeMaterial(data);
}

export async function deleteMaterial(id: string): Promise<void> {
  await apiClient.delete(`/materials/${id}/`);
}

export interface AdjustStockInput {
  materialId: string;
  type: MaterialMovementType;
  quantity: number;
  note?: string;
  /** Offline-queue replay support (docs/00) — generated once, when the manager submits. */
  idempotencyKey?: string;
}

export async function adjustStock(input: AdjustStockInput): Promise<Material> {
  const { data } = await apiClient.post<RawMaterial>(
    `/materials/${input.materialId}/adjust-stock/`,
    {
      type: input.type,
      quantity: input.quantity,
      note: input.note,
      idempotencyKey: input.idempotencyKey,
    },
  );
  return normalizeMaterial(data);
}

export async function listMaterialMovements(materialId: string): Promise<MaterialMovement[]> {
  const { data } = await apiClient.get<RawMovement[]>(`/materials/${materialId}/movements/`);
  return data.map((raw) => normalizeMovement(raw, materialId));
}

export interface SellMaterialsCartItem {
  materialId: string;
  quantity: number;
}

export interface SellMaterialsInput {
  items: SellMaterialsCartItem[];
  patientId: string;
  method: PaymentMethod;
  idempotencyKey?: string;
}

export interface MaterialsSaleResult {
  payment: Payment;
}

/**
 * POS checkout, one atomic call. The request carries material ids and
 * quantities only -- no price. The backend prices every line from the
 * material's own selling_price in the database (services.sell_materials);
 * a unitPrice field here would be exactly the tampering vector server-side
 * pricing exists to close (the mock priced a sale from whatever the client
 * sent, so a manipulated request could buy a 2,500 taka kit for 1 taka).
 */
export async function sellMaterials(input: SellMaterialsInput): Promise<MaterialsSaleResult> {
  const { data } = await apiClient.post<{ payment: RawPayment }>(
    "/materials/sell/",
    {
      patient: input.patientId,
      items: input.items.map((item) => ({ material: item.materialId, quantity: item.quantity })),
      method: input.method,
      idempotencyKey: input.idempotencyKey,
    },
  );
  return { payment: normalizePayment(data.payment) };
}
