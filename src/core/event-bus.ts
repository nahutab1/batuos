// Lightweight pub/sub event bus for loose inter-module communication

type Handler<T = unknown> = (payload: T) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<Handler>>();

  on<T>(event: string, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as Handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler as Handler);
    };
  }

  async emit<T>(event: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    const promises = Array.from(handlers).map((handler) => handler(payload));
    await Promise.all(promises);
  }

  off(event: string): void {
    this.handlers.delete(event);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
