import { useLocation } from 'react-router';
import { BackLink } from '@/components/BackLink/BackLink';
import { campaignListPathFromSearch } from '@/routing/routes';
import { CampaignCreationForm } from './components/CampaignCreationForm/CampaignCreationForm';
import styles from './CampaignCreationPage.module.scss';

export function CampaignCreationPage() {
  const { search } = useLocation();
  const listPath = campaignListPathFromSearch(search);

  return (
    <section className={styles.page} aria-labelledby="creation-title">
      <header className={styles.heading}>
        <BackLink to={listPath}>Campaigns</BackLink>
        <h1 id="creation-title">Create campaign</h1>
      </header>

      <CampaignCreationForm listPath={listPath} />
    </section>
  );
}
