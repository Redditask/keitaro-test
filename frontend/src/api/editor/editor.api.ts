import type { CampaignStream, CampaignStreams } from '@/entities/stream';
import { apiRequest, jsonOptions } from '../client';
import type { PublishOffersDto } from './editor.dto';

export function syncCampaign(campaignId: number) {
  return apiRequest<CampaignStreams>(`/campaigns/${campaignId}/sync`, { method: 'POST' });
}

export function publishOffers(campaignId: number, streamId: number, input: PublishOffersDto) {
  return apiRequest<CampaignStream>(
    `/campaigns/${campaignId}/streams/${streamId}/offers`,
    jsonOptions('PUT', input),
  );
}
