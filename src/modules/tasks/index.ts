import { container, registerModule } from '@/core';
import { TaskService, TASK_SERVICE } from './service';

export function initTaskModule() {
  container.registerFactory(TASK_SERVICE, () => new TaskService());
}

// Initialize at startup
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
  registerModule({
    name: 'tasks',
    initialize: initTaskModule,
  });
}

export type { Task, CreateTaskDTO, UpdateTaskDTO } from './types';
export { TaskService, TASK_SERVICE } from './service';
