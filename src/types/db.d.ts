/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Document } from 'mongoose';

interface PageResult<T> {
  docs: T[];
  total: number;
  limit: number;
  page: number;
  pages: number;
  sort: string;
}

interface Populate {
  path: string;
  select?: string;
  populate?: Populate[];
}

interface PageOptions {
  q?: string;
  sort?: Record<string>;
  select?: string;
  limit?: number;
  page?: number;
  key?: string;
  direction?: 'next' | 'previous';
  populate?: Populate[];
}

interface PagedModel<T extends Document> extends Model<T> {
  page(query: any, options: PageOptions): Promise<PageResult<T>>;
}

interface SearchableModel<T extends Document> extends Model<T> {
  look(q: string, options?: { query?: Query; populate?: Populate[]; page?: number; limit?: number }): Promise<T[]>;
  search(query: any, options: any, callback: any): Promise<T[]>;
  createMapping(settings: any, callback: any): any;
  bulkError(): any;
  synchronize(): any;
  esTruncate(callback: any): any;
}

type Query = Record<string, any> & {
  q?: string;
};

type _Status = 'active' | 'blocked' | 'deleted';

interface DefaultDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
  _status: _Status;
}

interface QueryParams {
  sort: string;
  page: number;
  limit: number;
  q: string;
  key: string;
  direction: 'next' | 'previous';
  _status: string;
}
