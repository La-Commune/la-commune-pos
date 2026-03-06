"use client";

import { create } from "zustand";

interface SyncState {
  isOnline: boolean;
  pendingActions: number;
  lastSyncAt: Date | null;
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  setPendingActions: (count: number) => void;
  setLastSync: (date: Date) => void;
  setSyncing: (syncing: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  pendingActions: 0,
  lastSyncAt: null,
  isSyncing: false,
  setOnline: (isOnline) => set({ isOnline }),
  setPendingActions: (pendingActions) => set({ pendingActions }),
  setLastSync: (date) => set({ lastSyncAt: date }),
  setSyncing: (isSyncing) => set({ isSyncing }),
}));
