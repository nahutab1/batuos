// Lightweight Dependency Injection Container
// Modules register services by token; consumers resolve by token.
// No concrete imports needed — swap implementations freely.

type Token<T> = symbol & { __type?: T };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Factory<T> = (...args: any[]) => T;

class Container {
  private singletons = new Map<symbol, unknown>();
  private factories = new Map<symbol, Factory<unknown>>();

  /** Register a singleton value */
  registerInstance<T>(token: Token<T>, instance: T): void {
    this.singletons.set(token, instance);
  }

  /** Register a factory (lazy singleton) */
  registerFactory<T>(token: Token<T>, factory: Factory<T>): void {
    this.factories.set(token, factory);
  }

  /** Resolve a service by token */
  resolve<T>(token: Token<T>): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`No binding found for token: ${token.toString()}`);
    }

    const instance = factory() as T;
    this.singletons.set(token, instance);
    return instance;
  }

  /** Check if token is registered */
  has<T>(token: Token<T>): boolean {
    return this.singletons.has(token) || this.factories.has(token);
  }

  /** Clear all registrations (useful for testing) */
  clear(): void {
    this.singletons.clear();
    this.factories.clear();
  }
}

/** Create a typed token for DI */
export function createToken<T>(name: string): Token<T> {
  return Symbol(name) as Token<T>;
}

/** Global DI container singleton */
export const container = new Container();

export type { Token };
