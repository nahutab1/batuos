import { NoteRepository } from './repository';
import { eventBus } from '@/core/event-bus';
import type { CreateNoteDTO, UpdateNoteDTO } from './types';
import type { PaginatedResult, ServiceResult } from '@/core/types';
import type { Note } from './types';

export class NoteService {
  constructor(private repo = new NoteRepository()) {}

  async getAll(page?: number, pageSize?: number): Promise<PaginatedResult<Note>> {
    return this.repo.getAll(page, pageSize);
  }

  async getById(id: string): Promise<ServiceResult<Note>> {
    return this.repo.getById(id);
  }

  async create(dto: CreateNoteDTO): Promise<ServiceResult<Note>> {
    const result = await this.repo.create(dto);
    if (result.data) {
      await eventBus.emit('note:created', result.data);
    }
    return result;
  }

  async update(id: string, dto: UpdateNoteDTO): Promise<ServiceResult<Note>> {
    const result = await this.repo.update(id, dto);
    if (result.data) {
      await eventBus.emit('note:updated', result.data);
    }
    return result;
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const result = await this.repo.delete(id);
    if (!result.error) {
      await eventBus.emit('note:deleted', { id });
    }
    return result;
  }
}
