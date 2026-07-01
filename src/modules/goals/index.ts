import { container, createToken, registerModule } from '@/core';
import { GoalService } from './service';

export const GOAL_SERVICE = createToken<GoalService>('GoalService');

export function initGoalModule() {
  container.registerFactory(GOAL_SERVICE, () => new GoalService());
}

registerModule({
  name: 'goals',
  initialize: initGoalModule,
});

export type { Goal, CreateGoalDTO, UpdateGoalDTO } from './types';
export { GoalService } from './service';
