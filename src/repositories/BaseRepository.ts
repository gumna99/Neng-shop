export interface PaginationResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export abstract class BaseRepository<T> {
  protected calculatePagination(
    page: number,
    limit: number,
    total: number
  ): Omit<PaginationResult<T>, 'data'> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    };
  }

  protected getSkipAmount(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  protected validatePaginationParams(page: number, limit: number): void {
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }
    if (limit < 1) {
      throw new Error('Limit must be greater than 0');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }
  }
}