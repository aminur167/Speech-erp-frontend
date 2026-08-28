import type { Service, ServiceCategory } from "@/types/domain";

/**
 * Mock implementation — matches the exact shape/signature this module will have
 * once it calls the real Django/DRF `/services/` endpoints. Swap the body of
 * each function for a real `apiClient` call later; callers never change.
 */

let mockServices: Service[] = [
  { id: "s-1", name: "Consultation", code: "DLY-CONSULT", category: "daily", fee: 800, isOnline: false, description: "Initial or follow-up in-person consultation." },
  { id: "s-2", name: "Outdoor Session", code: "DLY-OUTDOOR", category: "daily", fee: 1000, isOnline: false, description: "Single outdoor therapy session." },
  { id: "s-3", name: "Materials / Equipment", code: "DLY-MATERIAL", category: "daily", fee: 500, isOnline: false, description: "Therapy materials or equipment fee." },
  { id: "s-4", name: "Certificate Fee", code: "DLY-CERT", category: "daily", fee: 300, isOnline: false, description: "Assessment or completion certificate." },
  { id: "s-5", name: "Individual Therapy", code: "MON-INDIV", category: "monthly", fee: 5000, isOnline: false, description: "Monthly individual speech therapy package." },
  { id: "s-6", name: "Group Therapy", code: "MON-GROUP", category: "monthly", fee: 3000, isOnline: false, description: "Monthly group therapy package." },
  { id: "s-8", name: "Online Session", code: "ONL-SESSION", category: "online", fee: 1200, isOnline: true, description: "Live online therapy session." },
  { id: "s-9", name: "Online Consultation", code: "ONL-CONSULT", category: "online", fee: 900, isOnline: true, description: "Live online consultation." },
  {
    id: "s-10",
    name: "Screening",
    code: "PKG-SCR-01",
    category: "installment",
    fee: 4000,
    isOnline: false,
    description: "Comprehensive speech & language screening with a same-day findings summary and referral plan.",
    registrationFee: 0,
    durationLabel: "1 Day",
    sessionsLabel: "1 Session",
    expiryLabel: "Valid same day",
  },
  {
    id: "s-11",
    name: "Assessment",
    code: "PKG-ASM-01",
    category: "installment",
    fee: 18500,
    isOnline: false,
    description: "In-depth diagnostic assessment across three sessions, including a full written report and therapy roadmap.",
    registrationFee: 0,
    durationLabel: "3 Days – 3 Months",
    sessionsLabel: "3 Sessions",
    expiryLabel: "3 months from purchase",
  },
  {
    id: "s-12",
    name: "Monthly 1:1 Individual Plan",
    code: "PKG-M1-01",
    category: "installment",
    fee: 12600,
    isOnline: false,
    description: "Twelve one-to-one therapy sessions per month with priority scheduling, a personalized home-practice plan, and monthly progress reviews.",
    originalFee: 14000,
    registrationFee: 1000,
    durationLabel: "1 Month (auto-renew)",
    sessionsLabel: "12 Sessions",
    expiryLabel: "Last day of billing month",
  },
];

let sequence = mockServices.length;

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function listServices(category?: ServiceCategory): Promise<Service[]> {
  await delay(null);
  return category ? mockServices.filter((service) => service.category === category) : mockServices;
}

export async function getService(id: string): Promise<Service> {
  await delay(null, 200);
  const service = mockServices.find((s) => s.id === id);
  if (!service) {
    throw { message: "Service not found.", status: 404 };
  }
  return service;
}

export interface ServiceInput {
  name: string;
  code: string;
  category: ServiceCategory;
  fee: number;
  isOnline: boolean;
  description?: string;
  originalFee?: number;
  registrationFee?: number;
  durationLabel?: string;
  sessionsLabel?: string;
  expiryLabel?: string;
}

export async function createService(input: ServiceInput): Promise<Service> {
  await delay(null);
  sequence += 1;
  const newService: Service = { id: `s-${sequence}-${Date.now()}`, ...input };
  mockServices = [...mockServices, newService];
  return newService;
}

export async function updateService(id: string, input: ServiceInput): Promise<Service> {
  await delay(null);
  const index = mockServices.findIndex((s) => s.id === id);
  if (index === -1) {
    throw { message: "Service not found.", status: 404 };
  }
  const updated: Service = { id, ...input };
  mockServices = mockServices.map((s) => (s.id === id ? updated : s));
  return updated;
}

export async function deleteService(id: string): Promise<void> {
  await delay(null, 200);
  mockServices = mockServices.filter((s) => s.id !== id);
}
