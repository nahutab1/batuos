import { GoalRepository } from './repository';
import { eventBus } from '@/core/event-bus';
import type { CreateGoalDTO, UpdateGoalDTO } from './types';
import type { PaginatedResult, ServiceResult } from '@/core/types';
import type { Goal } from './types';

export class GoalService {
  constructor(private repo = new GoalRepository()) {}

  async getAll(page?: number, pageSize?: number): Promise<PaginatedResult<Goal>> {
    return this.repo.getAll(page, pageSize);
  }

  async getById(id: string): Promise<ServiceResult<Goal>> {
    return this.repo.getById(id);
  }

  async create(dto: CreateGoalDTO): Promise<ServiceResult<Goal>> {
    const result = await this.repo.create(dto);
    if (result.data) {
      await eventBus.emit('goal:created', result.data);
    }
    return result;
  }

  async update(id: string, dto: UpdateGoalDTO): Promise<ServiceResult<Goal>> {
    const result = await this.repo.update(id, dto);
    if (result.data) {
      await eventBus.emit('goal:updated', result.data);
    }
    return result;
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const result = await this.repo.delete(id);
    if (!result.error) {
      await eventBus.emit('goal:deleted', { id });
    }
    return result;
  }
}
