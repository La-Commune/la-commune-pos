// Tests de la cola offline (Dexie/IndexedDB) usando fake-indexeddb
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import {
  offlineDb,
  enqueueAction,
  getPendingActions,
  removeAction,
  markRetry,
  clearAllActions,
} from "../offline-queue";

beforeEach(async () => {
  await clearAllActions();
});

describe("enqueueAction", () => {
  it("encola una acción y devuelve su id", async () => {
    const id = await enqueueAction("CREATE_ORDER", { folio: 1 });
    expect(typeof id).toBe("number");

    const pending = await getPendingActions();
    expect(pending).toHaveLength(1);
    expect(pending[0].type).toBe("CREATE_ORDER");
    expect(pending[0].payload).toEqual({ folio: 1 });
    expect(pending[0].retries).toBe(0);
    expect(pending[0].createdAt).toBeInstanceOf(Date);
  });

  it("soporta todos los tipos de acción", async () => {
    await enqueueAction("CREATE_ORDER", {});
    await enqueueAction("UPDATE_ORDER_STATUS", {});
    await enqueueAction("UPDATE_TABLE_STATUS", {});
    await enqueueAction("CREATE_PAYMENT", {});
    await enqueueAction("ADD_STAMP", {});
    expect(await getPendingActions()).toHaveLength(5);
  });
});

describe("getPendingActions", () => {
  it("devuelve las acciones ordenadas por fecha de creación", async () => {
    // Insertamos con fechas explícitas para no depender del reloj
    await offlineDb.actions.bulkAdd([
      { type: "CREATE_PAYMENT", payload: { n: 2 }, createdAt: new Date("2026-06-03T02:00:00Z"), retries: 0 },
      { type: "CREATE_ORDER", payload: { n: 1 }, createdAt: new Date("2026-06-03T01:00:00Z"), retries: 0 },
      { type: "ADD_STAMP", payload: { n: 3 }, createdAt: new Date("2026-06-03T03:00:00Z"), retries: 0 },
    ]);

    const pending = await getPendingActions();
    expect(pending.map((a) => a.payload.n)).toEqual([1, 2, 3]);
  });

  it("devuelve lista vacía cuando no hay nada encolado", async () => {
    expect(await getPendingActions()).toEqual([]);
  });
});

describe("removeAction", () => {
  it("elimina solo la acción indicada", async () => {
    const id1 = await enqueueAction("CREATE_ORDER", { n: 1 });
    await enqueueAction("CREATE_PAYMENT", { n: 2 });

    await removeAction(id1);

    const pending = await getPendingActions();
    expect(pending).toHaveLength(1);
    expect(pending[0].type).toBe("CREATE_PAYMENT");
  });
});

describe("markRetry", () => {
  it("incrementa retries y guarda el último error", async () => {
    const id = await enqueueAction("CREATE_ORDER", {});

    await markRetry(id, "network timeout");
    await markRetry(id, "500 from server");

    const [action] = await getPendingActions();
    expect(action.retries).toBe(2);
    expect(action.lastError).toBe("500 from server");
  });
});

describe("clearAllActions", () => {
  it("vacía la cola completa", async () => {
    await enqueueAction("CREATE_ORDER", {});
    await enqueueAction("ADD_STAMP", {});

    await clearAllActions();

    expect(await getPendingActions()).toEqual([]);
  });
});
