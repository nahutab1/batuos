// Module interface — every module must conform
export interface ModuleDefinition {
  name: string;
  initialize: () => void | Promise<void>;
}

const modules = new Map<string, ModuleDefinition>();

export function registerModule(mod: ModuleDefinition): void {
  if (modules.has(mod.name)) {
    console.warn(`Module "${mod.name}" already registered, skipping.`);
    return;
  }
  modules.set(mod.name, mod);
}

export async function initializeAllModules(): Promise<void> {
  for (const [name, mod] of modules) {
    console.log(`[BatuOS] Initializing module: ${name}`);
    await mod.initialize();
  }
}

export function getModule(name: string): ModuleDefinition | undefined {
  return modules.get(name);
}

export function listModules(): string[] {
  return Array.from(modules.keys());
}
