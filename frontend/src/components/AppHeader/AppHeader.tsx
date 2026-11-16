import { Link, useLocation, useMatch } from 'react-router';
import { ArrowIcon } from '@/components/ArrowIcon/ArrowIcon';
import { campaignListPathFromSearch, routes } from '@/routing/routes';
import styles from './AppHeader.module.scss';

export function AppHeader() {
  const { search } = useLocation();
  const listPath = campaignListPathFromSearch(search);

  const isEditor = useMatch(routes.campaignEditor);
  const isCreation = useMatch(routes.createCampaign);
  const section = isCreation ? 'Create campaign' : isEditor ? 'Offers' : undefined;

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link to={listPath} className={styles.brand}>
          <svg
            viewBox="0 0 24 24"
            width="23"
            height="23"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m4.5 18 4-3.8m2.1 1.6c.1-5 4.4-7.5 9-7.5m-5.8-2.8h4" />
          </svg>
          Relay
        </Link>

        <ArrowIcon direction="right" />
        <Link to={listPath} className={styles.navLink} aria-current={section ? undefined : 'page'}>
          Campaigns
        </Link>

        {section && (
          <>
            <ArrowIcon direction="right" />
            <span className={styles.section} aria-current="page">
              {section}
            </span>
          </>
        )}
      </nav>
    </header>
  );
}
