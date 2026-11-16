import type { Campaign } from './campaign';

export type OfferState = 'active' | 'disabled' | 'removed';

export interface StreamOffer {
  offer_id: number;
  name: string;
  state: OfferState;
  share: number;
  is_pinned: boolean;
}

export interface CampaignStream {
  id: number;
  name: string;
  position: number;
  state: string;
  routing_schema: string;
  is_editable: boolean;
  redirect_url: string | null;
  country_codes: string[];
  offers: StreamOffer[];
}

export interface CampaignStreams {
  campaign: Campaign;
  streams: CampaignStream[];
}

export interface PublishedOffer {
  offer_id: number;
  state: Exclude<OfferState, 'removed'>;
  share: number;
  is_pinned: boolean;
}
