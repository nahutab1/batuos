import { BaseEntity } from '@/core/types';

export interface Memory extends BaseEntity {
  fact: string;
  context: string | null;
  source: 'manual' | 'telegram' | 'ai_extracted';
}

export interface CreateMemoryDTO {
  fact: string;
  context?: string;
  source?: 'manual' | 'telegram' | 'ai_extracted';
}

export interface UpdateMemoryDTO {
  fact?: string;
  context?: string;
  source?: 'manual' | 'telegram' | 'ai_extracted';
}
