import { ParamMap, Params } from '@angular/router';
import { SortDir } from '../ui/admin-data-table.component';
import { ListQuery } from '../../../core/services/admin-catalog.service';

/** Fully deep-linkable list state carried in the URL query string. */
export interface ListState {
  page: number;
  sortKey: string | null;
  sortDir: SortDir;
  q: string;
  status: string;
  filters: Record<string, string>;
}

const RESERVED = new Set(['page', 'sort', 'q', 'status', 'open']);
export const PAGE_SIZE = 20;

/** Reads the URL query params into a normalized {@link ListState}. */
export function parseListState(pm: ParamMap): ListState {
  const sort = (pm.get('sort') ?? '').split(',');
  const filters: Record<string, string> = {};
  for (const key of pm.keys) {
    if (RESERVED.has(key)) continue;
    const v = pm.get(key);
    if (v) filters[key] = v;
  }
  return {
    page: Math.max(0, Number(pm.get('page')) || 0),
    sortKey: sort[0] || null,
    sortDir: sort[1] === 'desc' ? 'desc' : 'asc',
    q: pm.get('q') ?? '',
    status: pm.get('status') ?? '',
    filters,
  };
}

/** Serializes a {@link ListState} back to a flat query-param object (empties dropped). */
export function buildListParams(s: ListState): Params {
  const params: Params = {};
  if (s.page > 0) params['page'] = s.page;
  if (s.sortKey) params['sort'] = `${s.sortKey},${s.sortDir}`;
  if (s.q.trim()) params['q'] = s.q.trim();
  if (s.status) params['status'] = s.status;
  for (const [k, v] of Object.entries(s.filters)) if (v) params[k] = v;
  return params;
}

/** Adapts a {@link ListState} into the catalog service's {@link ListQuery}. */
export function toListQuery(s: ListState): ListQuery {
  return { search: s.q, sortKey: s.sortKey ?? undefined, sortDir: s.sortDir, filters: s.filters };
}
