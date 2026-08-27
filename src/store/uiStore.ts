import { create } from "zustand";
import type { Branch } from "@/types/domain";

interface UiState {
  activeBranch: Branch | null;
  /** Desktop: sidebar is fixed and always visible; this only toggles rail (icon-only) vs full width. */
  isSidebarCollapsed: boolean;
  /** Mobile: sidebar is an off-canvas overlay; this toggles it open/closed. */
  isMobileSidebarOpen: boolean;
  setActiveBranch: (branch: Branch | null) => void;
  toggleSidebarCollapsed: () => void;
  expandSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeBranch: null,
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  setActiveBranch: (branch) => set({ activeBranch: branch }),
  toggleSidebarCollapsed: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  expandSidebar: () => set({ isSidebarCollapsed: false }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
}));
