export interface Campaign {
  id: number;
  name: string;
  state: string;
}

export interface CampaignListResponse {
  items: Campaign[];
  page: number;
  has_next: boolean;
}

export interface CampaignOption {
  id: number;
  name: string;
}

export interface CampaignOptions {
  groups: CampaignOption[];
  domains: CampaignOption[];
  traffic_sources: CampaignOption[];
}
