import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router';
import { errorMessage } from '@/api/client';
import { syncCampaign } from '@/api/editor/editor.api';
import { BackLink } from '@/components/BackLink/BackLink';
import { Button } from '@/components/Button/Button';
import { InlineMessage } from '@/components/InlineMessage/InlineMessage';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { campaignListPathFromSearch } from '@/routing/routes';
import { CampaignEditor } from './components/CampaignEditor/CampaignEditor';
import styles from './CampaignEditorPage.module.scss';

export function CampaignEditorPage() {
  const { campaignId } = useParams();
  const { search } = useLocation();
  const id = Number(campaignId);
  const valid = Number.isSafeInteger(id) && id > 0;
  const query = useQuery({
    queryKey: ['campaign-editor', id],
    queryFn: () => syncCampaign(id),
    enabled: valid,
    gcTime: 0,
    staleTime: Infinity,
  });

  return (
    <section className={styles.page} aria-labelledby="editor-title">
      <BackLink to={campaignListPathFromSearch(search)}>Campaigns</BackLink>
      <h1 id="editor-title">Campaign offers</h1>

      {!valid && <InlineMessage tone="error">Invalid campaign ID.</InlineMessage>}
      {query.error && (
        <InlineMessage
          tone="error"
          actions={
            <Button size="compact" disabled={query.isFetching} onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        >
          {errorMessage(query.error)}
        </InlineMessage>
      )}

      {valid && query.isPending && (
        <div className={styles.loading} role="status" aria-label="Loading streams">
          <Skeleton width="min(65%, 20rem)" height="1rem" />
          <Skeleton width="min(100%, 26rem)" height="2.7rem" />
          <Skeleton width="100%" height="12rem" />
        </div>
      )}

      {query.data && <CampaignEditor key={id} initial={query.data} />}
    </section>
  );
}
