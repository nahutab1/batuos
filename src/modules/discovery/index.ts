import { container, createToken, registerModule } from '@/core';
import { StartupService, STARTUP_SERVICE } from './service';

export const STARTUP_REPOSITORY = createToken<unknown>('STARTUP_REPOSITORY');

export function initDiscoveryModule() {
  container.registerFactory(STARTUP_SERVICE, () => new StartupService());
}

registerModule({
  name: 'discovery',
  initialize: initDiscoveryModule,
});

export type { StartupIdea, DiscoveryDiscussion, ChatMessage, CreateStartupIdeaDTO, UpdateStartupIdeaDTO, DiscoveredIdea } from './types';
export type { BusinessModel, AgeLabel } from './types';
export { StartupService, STARTUP_SERVICE } from './service';
