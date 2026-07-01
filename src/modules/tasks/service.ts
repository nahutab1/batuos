import { Task } from './types';
import { TaskRepository } from './repository';
import { prioritizeTasks, parseNaturalLanguageTask } from '@/lib/gemini';
import { ServiceResult } from '@/core/types';
import { createToken, container } from '@/core';

// DI token for TaskService
export const TASK_SERVICE = createToken<TaskService>('TASK_SERVICE');

export class TaskService {
  constructor(private repository: TaskRepository = new TaskRepository()) {}

  async getAll(page = 1, pageSize = 20): Promise<ServiceResult<{ data: Task[]; count: number }>> {
    try {
      const result = await this.repository.getAll(page, pageSize);
      return { data: result, error: null };
    } catch (error) {
      return { data: { data: [], count: 0 }, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getById(id: string): Promise<ServiceResult<Task | undefined>> {
    try {
      const result = await this.repository.getById(id);
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: undefined, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async create(dto: { title: string; priority?: number; due_date?: string }): Promise<ServiceResult<Task>> {
    try {
      const result = await this.repository.create(dto);
      if (result.data) {
        // Auto reprioritize after create
        this.reprioritize().catch((e) => console.error('Auto reprioritize error:', e));
      }
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createFromNaturalLanguage(text: string): Promise<ServiceResult<Task>> {
    try {
      const parsed = await parseNaturalLanguageTask(text);
      const result = await this.repository.create({
        title: parsed.title,
        priority: parsed.priority,
        due_date: parsed.due_date,
      });
      if (result.data) {
        // Auto reprioritize after create
        this.reprioritize().catch((e) => console.error('Auto reprioritize error:', e));
      }
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async update(id: string, dto: { title?: string; done?: boolean; priority?: number; due_date?: string }): Promise<ServiceResult<Task>> {
    try {
      const result = await this.repository.update(id, dto);
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const result = await this.repository.delete(id);
      return { data: null, error: result.error };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async reprioritize(): Promise<ServiceResult<void>> {
    try {
      const allTasks = await this.repository.getAll(1, 1000);
      // tasks uses 'status' field: 'todo', 'done', etc.
      const pending = allTasks.data.filter((t) => t.status !== 'done');

      if (pending.length === 0) {
        return { data: null, error: null };
      }

      const priorities = await prioritizeTasks(
        pending.map((t) => ({
          id: t.id,
          title: t.title,
        }))
      );

      for (const p of priorities) {
        await this.repository.update(p.id, { priority: p.priority });
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
