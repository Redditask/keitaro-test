import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router';
import { campaignListKey, fetchCampaigns } from '@/api/campaigns/campaigns.api';
import { errorMessage } from '@/api/client';
import { Button } from '@/components/Button/Button';
import { ButtonLink } from '@/components/ButtonLink/ButtonLink';
import { InlineMessage } from '@/components/InlineMessage/InlineMessage';
import { campaignEditorPath, readCampaignPage, routes } from '@/routing/routes';
import { CampaignList } from './components/CampaignList/CampaignList';
import { Pagination } from './components/Pagination/Pagination';
import styles from './CampaignsPage.module.scss';

export function CampaignsPage() {
  const { search, state } = useLocation();
  const page = readCampaignPage(search);
  const created = state?.created as { id: number; name: string } | undefined;
  const query = useQuery({
    queryKey: [...campaignListKey, page],
    queryFn: ({ signal }) => fetchCampaigns(page, signal),
  });
  const showList = Boolean(query.data) || query.isPending;
  const hasNext = query.data?.has_next ?? false;

  return (
    <section className={styles.page} aria-labelledby="campaigns-title">
      <div className={styles.heading}>
        <h1 id="campaigns-title">Campaigns</h1>

        <div className={styles.actions}>
          <ButtonLink variant="primary" to={`${routes.createCampaign}${search}`}>
            Create campaign
          </ButtonLink>
          <Button
            aria-label="Refresh campaigns"
            title="Refresh campaigns"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <svg
              className={query.isFetching ? styles.spinning : undefined}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 4v6h-6m6 0-2.6-3A8.5 8.5 0 1 0 20 16" />
            </svg>
          </Button>
        </div>
      </div>

      {created && (
        <InlineMessage
          tone="success"
          actions={<Link to={`${campaignEditorPath(created.id)}${search}`}>Open</Link>}
        >
          Campaign “{created.name}” created.
        </InlineMessage>
      )}

      {query.error && <InlineMessage tone="error">{errorMessage(query.error)}</InlineMessage>}

      {(showList || page > 1) && (
        <div className={styles.results} aria-busy={query.isFetching}>
          <Pagination page={page} hasNext={hasNext} />
          {showList && (
            <>
              <CampaignList items={query.data?.items} search={search} />
              <Pagination page={page} hasNext={hasNext} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
