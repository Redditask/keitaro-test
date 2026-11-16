import type { Campaign, CampaignListResponse, CampaignOptions } from '@/entities/campaign';
import { apiRequest, jsonOptions } from '../client';
import type { CreateCampaignDto } from './campaigns.dto';

export const campaignListKey = ['campaigns'] as const;

export function fetchCampaigns(page: number, signal: AbortSignal) {
  return apiRequest<CampaignListResponse>(`/campaigns?page=${page}`, { signal });
}

export function fetchCampaignOptions(signal: AbortSignal) {
  return apiRequest<CampaignOptions>('/campaign-options', { signal });
}

export function createCampaign(input: CreateCampaignDto) {
  return apiRequest<Campaign>('/campaigns', jsonOptions('POST', input));
}
