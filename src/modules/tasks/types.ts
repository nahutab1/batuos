import type { BaseEntity } from '@/core/types';

export type Task = BaseEntity & {
  title: string;
  done: boolean;
  status?: string;
  priority?: number;
  due_date?: string;
};

export interface CreateTaskDTO {
  title: string;
  priority?: number;
  due_date?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  done?: boolean;
  status?: string;
  priority?: number;
  due_date?: string;
}
