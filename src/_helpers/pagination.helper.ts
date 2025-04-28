import { FilterQuery, Model } from 'mongoose';

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export enum EmailSortOpt {
  THEME = 'subject',
  SENDER = 'from',
  RECEIVED = 'date',
}

export type SortRule = { [key: string]: 'asc' | 'desc' };

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sort?: SortRule;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  total: number;
}

export async function paginate<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  paginationOptions: PaginationOptions,
  projection?: Record<string, any>,
): Promise<PaginatedResponse<T>> {
  const { page, pageSize, sort } = paginationOptions;
  const skip = (page - 1) * pageSize;

  const total = await model.countDocuments(filter);
  const query = model.find(filter);

  if (projection) {
    query.select(projection);
  }

  if (sort) {
    query.sort(sort);
  }

  const data = await query.skip(skip).limit(pageSize).exec();

  return { data, currentPage: page, pageSize, total };
}
