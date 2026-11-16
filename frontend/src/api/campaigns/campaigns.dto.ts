export interface CreateCampaignDto {
  name: string;
  country_codes: string[];
  offer_id: number;
  group_id: number;
  domain_id: number;
  traffic_source_id: number;
}
