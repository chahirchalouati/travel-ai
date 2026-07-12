import { BadgeTone } from './admin-status-badge.component';

/** Maps a domain status string to a semantic badge tone, so color is consistent everywhere. */
export function statusTone(status: string | null | undefined): BadgeTone {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED':
    case 'CONFIRMED':
    case 'ACTIVE':
    case 'PAID':
      return 'ok';
    case 'PENDING':
    case 'PROCESSING':
      return 'pending';
    case 'FAILED':
    case 'CANCELLED':
    case 'SUSPENDED':
      return 'danger';
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'warn';
    default:
      return 'neutral';
  }
}

/** Boolean active/inactive → tone. */
export function activeTone(active: boolean | null | undefined): BadgeTone {
  return active ? 'ok' : 'danger';
}
