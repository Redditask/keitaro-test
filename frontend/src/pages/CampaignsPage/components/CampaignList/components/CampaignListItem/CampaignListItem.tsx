import { Link } from 'react-router';
import type { Campaign } from '@/entities/campaign';
import { campaignEditorPath } from '@/routing/routes';
import styles from './CampaignListItem.module.scss';

const statusLabels: Record<string, string> = {
  active: 'Active',
  disabled: 'Disabled',
  paused: 'Paused',
  deleted: 'Deleted',
};

export function CampaignListItem({ campaign, search }: { campaign: Campaign; search: string }) {
  return (
    <tr className={styles.row}>
      <td>
        <Link className={styles.campaignName} to={`${campaignEditorPath(campaign.id)}${search}`}>
          {campaign.name}
        </Link>
      </td>
      <td className={styles.id}>#{campaign.id}</td>
      <td>
        <span className={styles.status} data-active={campaign.state === 'active' || undefined}>
          {statusLabels[campaign.state] ?? campaign.state}
        </span>
      </td>
      <td aria-hidden="true">
        <svg
          viewBox="0 0 20 20"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m7 4 6 6-6 6" />
        </svg>
      </td>
    </tr>
  );
}
