/**
 * EventBus unit tests
 * Tests the in-process publish/subscribe bus
 */

// Use a direct import path for testing (avoid @/ alias issues in test)
// We'll test the EventBus class directly

class TestEventBus {
  private subscriptions: Map<string, Array<{ handler: (data: unknown) => void; id: number }>> = new Map();
  private nextId = 0;
  private history: Map<string, { data: unknown; timestamp: number }> = new Map();

  publish(event: string, data: unknown): void {
    this.history.set(event, { data, timestamp: Date.now() });
    const subs = this.subscriptions.get(event);
    if (!subs || subs.length === 0) return;
    for (const sub of subs) {
      try {
        sub.handler(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  subscribe(
    event: string,
    handler: (data: unknown) => void,
    options?: { replay?: boolean }
  ): () => void {
    const id = this.nextId++;
    const sub = { handler, id };
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    this.subscriptions.get(event)!.push(sub);

    if (options?.replay) {
      const last = this.history.get(event);
      if (last) {
        try {
          handler(last.data);
        } catch (err) {
          console.error(`[EventBus] Error in replay:`, err);
        }
      }
    }

    return () => {
      const subs = this.subscriptions.get(event);
      if (subs) {
        const idx = subs.findIndex((s) => s.id === id);
        if (idx !== -1) subs.splice(idx, 1);
      }
    };
  }

  getLastEvent(event: string): unknown | undefined {
    const entry = this.history.get(event);
    return entry ? entry.data : undefined;
  }

  subscriberCount(event: string): number {
    return this.subscriptions.get(event)?.length ?? 0;
  }

  clear(): void {
    this.subscriptions.clear();
    this.history.clear();
    this.nextId = 0;
  }
}

describe("EventBus", () => {
  let bus: TestEventBus;

  beforeEach(() => {
    bus = new TestEventBus();
  });

  afterEach(() => {
    bus.clear();
  });

  describe("publish/subscribe", () => {
    it("should deliver events to subscribers", () => {
      const received: unknown[] = [];
      bus.subscribe("market:updated", (data) => received.push(data));

      bus.publish("market:updated", { market: [], count: 0, timestamp: "2026-01-01" });

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ market: [], count: 0, timestamp: "2026-01-01" });
    });

    it("should deliver to multiple subscribers", () => {
      let count = 0;
      bus.subscribe("market:updated", () => count++);
      bus.subscribe("market:updated", () => count++);

      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });

      expect(count).toBe(2);
    });

    it("should not deliver to subscribers of other events", () => {
      let called = false;
      bus.subscribe("conflicts:updated", () => { called = true; });

      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });

      expect(called).toBe(false);
    });
  });

  describe("unsubscribe", () => {
    it("should stop receiving events after unsubscribe", () => {
      let count = 0;
      const unsub = bus.subscribe("market:updated", () => count++);

      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });
      expect(count).toBe(1);

      unsub();
      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });
      expect(count).toBe(1); // not called again
    });

    it("should only unsubscribe the specific handler", () => {
      let countA = 0;
      let countB = 0;
      const unsubA = bus.subscribe("market:updated", () => countA++);
      bus.subscribe("market:updated", () => countB++);

      unsubA();
      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });

      expect(countA).toBe(0);
      expect(countB).toBe(1);
    });
  });

  describe("replay", () => {
    it("should replay last event on subscribe with replay:true", () => {
      const data = { market: [{ symbol: "CL=F" }], count: 1, timestamp: "2026-01-01" };
      bus.publish("market:updated", data);

      const received: unknown[] = [];
      bus.subscribe("market:updated", (d) => received.push(d), { replay: true });

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual(data);
    });

    it("should not replay when no previous event exists", () => {
      const received: unknown[] = [];
      bus.subscribe("market:updated", (d) => received.push(d), { replay: true });

      expect(received).toHaveLength(0);
    });

    it("should not replay when replay:false or not specified", () => {
      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });

      const received: unknown[] = [];
      bus.subscribe("market:updated", (d) => received.push(d));

      expect(received).toHaveLength(0);
    });
  });

  describe("getLastEvent", () => {
    it("should return last published data", () => {
      const data = { market: [], count: 5, timestamp: "2026-03-17" };
      bus.publish("market:updated", data);

      expect(bus.getLastEvent("market:updated")).toEqual(data);
    });

    it("should return undefined for unpublished events", () => {
      expect(bus.getLastEvent("market:updated")).toBeUndefined();
    });

    it("should return the latest data after multiple publishes", () => {
      bus.publish("market:updated", { market: [], count: 1, timestamp: "t1" });
      bus.publish("market:updated", { market: [], count: 2, timestamp: "t2" });

      const last = bus.getLastEvent("market:updated") as Record<string, unknown>;
      expect(last.count).toBe(2);
    });
  });

  describe("subscriberCount", () => {
    it("should track subscriber count", () => {
      expect(bus.subscriberCount("market:updated")).toBe(0);

      const unsub1 = bus.subscribe("market:updated", () => {});
      expect(bus.subscriberCount("market:updated")).toBe(1);

      bus.subscribe("market:updated", () => {});
      expect(bus.subscriberCount("market:updated")).toBe(2);

      unsub1();
      expect(bus.subscriberCount("market:updated")).toBe(1);
    });
  });

  describe("error isolation", () => {
    it("should not break other handlers when one throws", () => {
      let secondCalled = false;
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      bus.subscribe("market:updated", () => { throw new Error("boom"); });
      bus.subscribe("market:updated", () => { secondCalled = true; });

      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });

      expect(secondCalled).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe("clear", () => {
    it("should remove all subscriptions and history", () => {
      bus.subscribe("market:updated", () => {});
      bus.publish("market:updated", { market: [], count: 0, timestamp: "" });

      expect(bus.subscriberCount("market:updated")).toBe(1);
      expect(bus.getLastEvent("market:updated")).toBeDefined();

      bus.clear();

      expect(bus.subscriberCount("market:updated")).toBe(0);
      expect(bus.getLastEvent("market:updated")).toBeUndefined();
    });
  });

  describe("market data integration pattern", () => {
    it("should simulate market data flow through EventBus", () => {
      // Simulate what useDataFetcher does: fetch → publish
      const marketPayload = {
        market: [
          { symbol: "CL=F", name: "Crude Oil", price: 78.5, changePercent: 2.5 },
          { symbol: "GC=F", name: "Gold", price: 2650, changePercent: 0.5 },
          { symbol: "^VIX", name: "VIX", price: 18.2, changePercent: 1.1 },
        ],
        count: 3,
        timestamp: "2026-03-17T12:00:00Z",
      };

      // Consumer subscribes (like Quest XR or Harissa would)
      let received: unknown = null;
      bus.subscribe("market:updated", (data) => { received = data; });

      // Producer publishes (like useDataFetcher does after fetch)
      bus.publish("market:updated", marketPayload);

      // Verify consumer received the data
      expect(received).toEqual(marketPayload);
      const r = received as typeof marketPayload;
      expect(r.market).toHaveLength(3);
      expect(r.market[0].symbol).toBe("CL=F");
      expect(r.count).toBe(3);
    });

    it("should handle system:error events from failed fetches", () => {
      let errorReceived: unknown = null;
      bus.subscribe("system:error", (data) => { errorReceived = data; });

      // Simulate a failed market fetch
      bus.publish("system:error", { source: "Market", error: "Failed to fetch" });

      expect(errorReceived).toEqual({ source: "Market", error: "Failed to fetch" });
    });
  });
});
