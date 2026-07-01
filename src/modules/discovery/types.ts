import type { BaseEntity } from '@/core/types';

export type BusinessModel = 'SaaS' | 'Marketplace' | 'AI Tool' | 'E-commerce' | 'Social' | 'DevTool' | 'Content' | 'Hardware' | 'Other';
export type AgeLabel = 'brand_new' | 'very_new' | 'new' | 'trending' | 'established';

export interface StartupIdea extends BaseEntity {
  name: string;
  description: string | null;
  source: string;
  source_urls: string[];
  problem_solved: string | null;
  target_audience: string | null;
  business_model: string | null;
  why_noteworthy: string | null;
  first_seen_at: string | null;
  age_label: AgeLabel | null;
  engagement_score: number;
  metadata: Record<string, unknown>;
  duplicate_hash: string | null;
}

export interface CreateStartupIdeaDTO {
  name: string;
  description?: string;
  source: string;
  source_urls?: string[];
  problem_solved?: string;
  target_audience?: string;
  business_model?: string;
  why_noteworthy?: string;
  first_seen_at?: string;
  age_label?: AgeLabel;
  duplicate_hash?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateStartupIdeaDTO {
  name?: string;
  description?: string;
  source?: string;
  source_urls?: string[];
  problem_solved?: string;
  target_audience?: string;
  business_model?: string;
  why_noteworthy?: string;
  first_seen_at?: string;
  age_label?: AgeLabel;
  engagement_score?: number;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryDiscussion extends BaseEntity {
  startup_id: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DiscoveredIdea {
  name: string;
  description: string;
  source: string;
  source_urls: string[];
  problem_solved: string;
  target_audience: string;
  business_model: string;
  why_noteworthy: string;
  age_label: AgeLabel;
  duplicate_hash: string;
  first_seen_at?: string;
}
