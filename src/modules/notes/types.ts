import { BaseEntity } from '@/core/types';

export interface Note extends BaseEntity {
  title: string;
  content: string;
  tags: string[];
}

export interface CreateNoteDTO {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateNoteDTO {
  title?: string;
  content?: string;
  tags?: string[];
}
