import { MemoryRepository } from './repository';
import { eventBus } from '@/core/event-bus';
import type { CreateMemoryDTO, UpdateMemoryDTO } from './types';
import type { PaginatedResult, ServiceResult } from '@/core/types';
import type { Memory } from './types';

export class MemoryService {
  constructor(private repo = new MemoryRepository()) {}

  async getAll(page?: number, pageSize?: number): Promise<PaginatedResult<Memory>> {
    return this.repo.getAll(page, pageSize);
  }

  async getById(id: string): Promise<ServiceResult<Memory>> {
    return this.repo.getById(id);
  }

  async create(dto: CreateMemoryDTO): Promise<ServiceResult<Memory>> {
    const result = await this.repo.create(dto);
    if (result.data) {
      await eventBus.emit('memory:created', result.data);
    }
    return result;
  }

  async update(id: string, dto: UpdateMemoryDTO): Promise<ServiceResult<Memory>> {
    const result = await this.repo.update(id, dto);
    if (result.data) {
      await eventBus.emit('memory:updated', result.data);
    }
    return result;
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const result = await this.repo.delete(id);
    if (!result.error) {
      await eventBus.emit('memory:deleted', { id });
    }
    return result;
  }
}
