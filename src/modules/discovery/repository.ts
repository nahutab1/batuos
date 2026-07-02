import { createServerClient } from '@/lib/supabase';
import type { StartupIdea, CreateStartupIdeaDTO, UpdateStartupIdeaDTO, DiscoveryDiscussion, ChatMessage } from './types';
import type { PaginatedResult, ServiceResult } from '@/core/types';

const TABLE = 'startup_ideas';
const DISC_TABLE = 'discovery_discussions';

export class StartupRepository {
  private get db() {
    return createServerClient();
  }

  // ── Startup Ideas ──

  async getAll(page = 1, pageSize = 20, source?: string): Promise<PaginatedResult<StartupIdea>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.db.from(TABLE).select('*', { count: 'exact' });

    if (source) {
      query = query.eq('source', source);
    }

    const { data, count, error } = await query
      .order('first_seen_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { data: (data as StartupIdea[]) ?? [], count: count ?? 0, page, pageSize };
  }

  async getById(id: string): Promise<ServiceResult<StartupIdea>> {
    const { data, error } = await this.db.from(TABLE).select('*').eq('id', id).single();
    if (error) return { data: null, error: error.message };
    return { data: data as StartupIdea, error: null };
  }

  async getByHash(hash: string): Promise<StartupIdea | null> {
    const { data } = await this.db.from(TABLE).select('id').eq('duplicate_hash', hash).maybeSingle();
    return data as StartupIdea | null;
  }

  async getByHashes(hashes: string[]): Promise<{ data: StartupIdea[] | null; error: string | null }> {
    const { data, error } = await this.db.from(TABLE).select('duplicate_hash').in('duplicate_hash', hashes);
    if (error) return { data: null, error: error.message };
    return { data: data as StartupIdea[], error: null };
  }

  async create(dto: CreateStartupIdeaDTO): Promise<ServiceResult<StartupIdea>> {
    const { data, error } = await this.db.from(TABLE).insert(dto).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as StartupIdea, error: null };
  }

  async update(id: string, dto: UpdateStartupIdeaDTO): Promise<ServiceResult<StartupIdea>> {
    const { data, error } = await this.db.from(TABLE).update(dto).eq('id', id).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as StartupIdea, error: null };
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const { error } = await this.db.from(TABLE).delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  }

  async getRecent(limit = 20): Promise<StartupIdea[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('*')
      .order('first_seen_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data as StartupIdea[]) ?? [];
  }

  // ── Discussions ──

  async getDiscussion(startupId: string): Promise<ServiceResult<DiscoveryDiscussion>> {
    const { data, error } = await this.db.from(DISC_TABLE).select('*').eq('startup_id', startupId).single();
    if (error) return { data: null, error: error.message };
    return { data: data as DiscoveryDiscussion, error: null };
  }

  async createDiscussion(startupId: string): Promise<ServiceResult<DiscoveryDiscussion>> {
    const { data, error } = await this.db.from(DISC_TABLE).insert({ startup_id: startupId, messages: [] }).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as DiscoveryDiscussion, error: null };
  }

  async addMessage(startupId: string, message: ChatMessage): Promise<ServiceResult<DiscoveryDiscussion>> {
    const disc = await this.getDiscussion(startupId);
    if (disc.error || !disc.data) {
      const created = await this.createDiscussion(startupId);
      if (created.error) return created;
      disc.data = created.data;
    }

    const messages = [...(disc.data?.messages || []), message];
    const { data, error } = await this.db.from(DISC_TABLE).update({ messages }).eq('startup_id', startupId).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as DiscoveryDiscussion, error: null };
  }
}
