import { BaseEntity } from '@/core/types';

export interface Event extends BaseEntity {
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
}

export interface CreateEventDTO {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
}
