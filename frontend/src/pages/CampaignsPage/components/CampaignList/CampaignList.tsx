import type { Campaign } from '@/entities/campaign';
import { CampaignListItem } from './components/CampaignListItem/CampaignListItem';
import { CampaignListSkeleton } from './components/CampaignListSkeleton/CampaignListSkeleton';
import styles from './CampaignList.module.scss';

export function CampaignList({ items, search }: { items?: Campaign[]; search: string }) {
  return (
    <div className={styles.panel}>
      <table className={styles.table} aria-label="Keitaro campaigns">
        <thead>
          <tr>
            <th scope="col">Campaign</th>
            <th scope="col">ID</th>
            <th scope="col">Status</th>
            <th>
              <span className={styles.visuallyHidden}>Action</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {!items && <CampaignListSkeleton />}

          {items?.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.empty}>
                There are no campaigns on this page.
              </td>
            </tr>
          )}

          {items?.map((campaign) => (
            <CampaignListItem key={campaign.id} campaign={campaign} search={search} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
