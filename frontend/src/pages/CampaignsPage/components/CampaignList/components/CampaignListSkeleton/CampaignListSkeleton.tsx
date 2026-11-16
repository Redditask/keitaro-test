import { Skeleton } from '@/components/Skeleton/Skeleton';

export function CampaignListSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} aria-hidden="true">
      <td>
        <Skeleton width="min(100%, 12rem)" height="0.8rem" />
      </td>
      <td>
        <Skeleton width="2rem" height="0.8rem" />
      </td>
      <td>
        <Skeleton width="4rem" height="0.8rem" />
      </td>
      <td />
    </tr>
  ));
}
