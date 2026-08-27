import { create } from "zustand";
import type { Branch } from "@/types/domain";

interface UiState {
  activeBranch: Branch | null;
  isSidebarOpen: boolean;
  setActiveBranch: (branch: Branch | null) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeBranch: null,
  isSidebarOpen: true,
  setActiveBranch: (branch) => set({ activeBranch: branch }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
