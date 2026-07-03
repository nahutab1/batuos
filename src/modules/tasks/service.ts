import { Task } from './types';
import { TaskRepository } from './repository';
import { prioritizeTasks, parseNaturalLanguageTask } from '@/lib/gemini';
import { ServiceResult } from '@/core/types';
import { createToken } from '@/core';

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
      // Map done -> status for Supabase
      const dbDto: Record<string, unknown> = { ...dto };
      if (dto.done !== undefined) {
        dbDto.status = dto.done ? 'done' : 'todo';
        delete dbDto.done;
      }
      const result = await this.repository.update(id, dbDto as Record<string, unknown>);
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
      const pending = allTasks.data.filter((t) => t.status !== 'done');

      if (pending.length === 0) {
        return { data: null, error: null };
      }

      // Once AI prioritization yap, fallback'e client-side sort
      const priorities = await prioritizeTasks(
        pending.map((t) => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
        }))
      );

      // AI'dan dönen priority'leri uygula (geçerliyse)
      const aiValid = priorities.length > 0 && priorities.some(p => p.priority !== 50 && p.reasoning !== 'AI failed to parse');
      if (aiValid) {
        for (const p of priorities) {
          await this.repository.update(p.id, { priority: p.priority });
        }
      } else {
        // AI fail → client-side heuristik sırala
        console.log('[Reprioritize] AI failed, using heuristic for', pending.length, 'tasks');
        const now = new Date();
        const scored = pending.map(t => {
          let score = 50;
          const title = t.title.toLowerCase();
          const dd = t.due_date ? new Date(t.due_date) : null;

          // Due date varsa ona göre skorla
          if (dd) {
            const diffDays = Math.ceil((dd.getTime() - now.getTime()) / 86400000);
            if (diffDays < 0) score = 100;      // overdue
            else if (diffDays === 0) score = 95;  // today
            else if (diffDays === 1) score = 80;  // tomorrow
            else if (diffDays <= 3) score = 65;   // this week
            else if (diffDays <= 7) score = 50;   // this week later
            else score = 35;                      // next week+
          } else {
            // Başlığa göre skorla
            if (title.includes('bugün') || title.includes('hemen') || title.includes('acil')) score = 90;
            else if (title.includes('sınav') || title.includes('sinav')) score = 85;
            else if (title.includes('aşı') || title.includes('asi') || title.includes('sağlık') || title.includes('saglik') || title.includes('doktor')) score = 80;
            else if (title.includes('yarın') || title.includes('yarin') || title.includes('sabah')) score = 75;
            else if (title.includes('haftaya') || title.includes('gelecek')) score = 40;
            else if (title.includes('tatil') || title.includes('seyahat')) score = 20;
          }
          return { id: t.id, priority: score, title: t.title };
        });

        for (const s of scored) {
          await this.repository.update(s.id, { priority: s.priority });
        }
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
