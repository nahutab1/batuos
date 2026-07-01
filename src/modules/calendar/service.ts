import { EventRepository } from './repository';
import { eventBus } from '@/core/event-bus';
import type { CreateEventDTO, UpdateEventDTO } from './types';
import type { PaginatedResult, ServiceResult } from '@/core/types';
import type { Event } from './types';

export class CalendarService {
  constructor(private repo = new EventRepository()) {}

  async getAll(page?: number, pageSize?: number): Promise<PaginatedResult<Event>> {
    return this.repo.getAll(page, pageSize);
  }

  async getById(id: string): Promise<ServiceResult<Event>> {
    return this.repo.getById(id);
  }

  async create(dto: CreateEventDTO): Promise<ServiceResult<Event>> {
    const result = await this.repo.create(dto);
    if (result.data) {
      await eventBus.emit('event:created', result.data);
    }
    return result;
  }

  async update(id: string, dto: UpdateEventDTO): Promise<ServiceResult<Event>> {
    const result = await this.repo.update(id, dto);
    if (result.data) {
      await eventBus.emit('event:updated', result.data);
    }
    return result;
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const result = await this.repo.delete(id);
    if (!result.error) {
      await eventBus.emit('event:deleted', { id });
    }
    return result;
  }
}
