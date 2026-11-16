import { generatePath } from 'react-router';

export const routes = {
  campaigns: '/campaigns',
  createCampaign: '/campaigns/new',
  campaignEditor: '/campaigns/:campaignId/offers',
} as const;

export function readCampaignPage(search: string) {
  const page = Number(new URLSearchParams(search).get('page'));
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function campaignListPath(page: number) {
  return page > 1 ? `${routes.campaigns}?page=${page}` : routes.campaigns;
}

export function campaignListPathFromSearch(search: string) {
  return campaignListPath(readCampaignPage(search));
}

export function campaignEditorPath(campaignId: number) {
  return generatePath(routes.campaignEditor, { campaignId: String(campaignId) });
}
