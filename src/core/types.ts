// Base types used across all modules

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// Generic CRUD service interface
export interface CrudService<T extends BaseEntity, CreateDTO, UpdateDTO> {
  getAll(page?: number, pageSize?: number): Promise<PaginatedResult<T>>;
  getById(id: string): Promise<ServiceResult<T>>;
  create(data: CreateDTO): Promise<ServiceResult<T>>;
  update(id: string, data: UpdateDTO): Promise<ServiceResult<T>>;
  delete(id: string): Promise<ServiceResult<void>>;
}
