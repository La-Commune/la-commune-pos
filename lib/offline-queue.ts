import Dexie, { type EntityTable } from "dexie";

// ── Tipos de acciones offline ──
export type OfflineActionType =
  | "CREATE_ORDER"
  | "UPDATE_ORDER_STATUS"
  | "UPDATE_TABLE_STATUS"
  | "CREATE_PAYMENT"
  | "ADD_STAMP";

export interface OfflineAction {
  id?: number;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: Date;
  retries: number;
  lastError?: string;
}

// ── Base de datos IndexedDB ──
class OfflineDB extends Dexie {
  actions!: EntityTable<OfflineAction, "id">;

  constructor() {
    super("la-commune-pos-offline");
    this.version(1).stores({
      actions: "++id, type, createdAt",
    });
  }
}

export const offlineDb = new OfflineDB();

// ── API de la cola ──
export async function enqueueAction(
  type: OfflineActionType,
  payload: Record<string, unknown>
): Promise<number> {
  const id = await offlineDb.actions.add({
    type,
    payload,
    createdAt: new Date(),
    retries: 0,
  });
  return id as number;
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  return offlineDb.actions.orderBy("createdAt").toArray();
}

export async function removeAction(id: number): Promise<void> {
  await offlineDb.actions.delete(id);
}

export async function markRetry(id: number, error: string): Promise<void> {
  await offlineDb.actions.update(id, {
    retries: (await offlineDb.actions.get(id))!.retries + 1,
    lastError: error,
  });
}

export async function clearAllActions(): Promise<void> {
  await offlineDb.actions.clear();
}
