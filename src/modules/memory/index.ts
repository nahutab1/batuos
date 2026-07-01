import { container, createToken, registerModule } from '@/core';
import { MemoryService } from './service';

export const MEMORY_SERVICE = createToken<MemoryService>('MemoryService');

export function initMemoryModule() {
  container.registerFactory(MEMORY_SERVICE, () => new MemoryService());
}

registerModule({
  name: 'memory',
  initialize: initMemoryModule,
});

export type { Memory, CreateMemoryDTO, UpdateMemoryDTO } from './types';
export { MemoryService } from './service';
