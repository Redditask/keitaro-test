import type { CampaignStream } from '@/entities/stream';
import styles from './ReadOnlyStreamDetails.module.scss';

export function ReadOnlyStreamDetails({ stream }: { stream: CampaignStream }) {
  const { redirect_url: redirectUrl, country_codes: countryCodes } = stream;

  return (
    <div className={styles.details}>
      <p>{redirectUrl ? 'This stream redirects traffic.' : 'This stream is read-only.'}</p>

      {redirectUrl && <p className={styles.destination}>{redirectUrl}</p>}

      {countryCodes.length > 0 && (
        <p>
          Countries <strong>{countryCodes.join(', ')}</strong>
        </p>
      )}
    </div>
  );
}
