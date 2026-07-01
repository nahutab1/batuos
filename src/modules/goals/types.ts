import { BaseEntity } from '@/core/types';

export interface Goal extends BaseEntity {
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  target_date?: string;
  progress?: number;
  status?: 'active' | 'completed' | 'abandoned';
}

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  target_date?: string;
  progress?: number;
  status?: 'active' | 'completed' | 'abandoned';
}
