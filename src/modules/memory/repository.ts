import { createServerClient } from '@/lib/supabase';
import type { Memory, CreateMemoryDTO, UpdateMemoryDTO } from './types';
import type { PaginatedResult, ServiceResult } from '@/core/types';

const TABLE = 'memories';

export class MemoryRepository {
  private get db() {
    return createServerClient();
  }

  async getAll(page = 1, pageSize = 20): Promise<PaginatedResult<Memory>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await this.db
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return { data: (data as Memory[]) ?? [], count: count ?? 0, page, pageSize };
  }

  async getById(id: string): Promise<ServiceResult<Memory>> {
    const { data, error } = await this.db.from(TABLE).select('*').eq('id', id).single();
    if (error) return { data: null, error: error.message };
    return { data: data as Memory, error: null };
  }

  async create(dto: CreateMemoryDTO): Promise<ServiceResult<Memory>> {
    const { data, error } = await this.db.from(TABLE).insert(dto).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Memory, error: null };
  }

  async update(id: string, dto: UpdateMemoryDTO): Promise<ServiceResult<Memory>> {
    const { data, error } = await this.db.from(TABLE).update(dto).eq('id', id).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Memory, error: null };
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const { error } = await this.db.from(TABLE).delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  }
}
