import type { Offer } from '@/entities/offer';
import { apiRequest } from '../client';

export function searchOffers(term: string, signal: AbortSignal) {
  const query = new URLSearchParams({ search_term: term });
  return apiRequest<Offer[]>(`/offers?${query}`, { signal });
}
