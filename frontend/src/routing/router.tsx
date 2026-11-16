import { createBrowserRouter, Navigate } from 'react-router';

import { CampaignCreationPage } from '@/pages/CampaignCreationPage/CampaignCreationPage';
import { CampaignEditorPage } from '@/pages/CampaignEditorPage/CampaignEditorPage';
import { CampaignsPage } from '@/pages/CampaignsPage/CampaignsPage';
import { App } from '@/App';
import { routes } from './routes';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <Navigate to={routes.campaigns} replace /> },
      { path: routes.campaigns, element: <CampaignsPage /> },
      { path: routes.createCampaign, element: <CampaignCreationPage /> },
      { path: routes.campaignEditor, element: <CampaignEditorPage /> },
      { path: '*', element: <Navigate to={routes.campaigns} replace /> },
    ],
  },
]);
