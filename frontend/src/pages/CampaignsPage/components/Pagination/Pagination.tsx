import { Link } from 'react-router';
import { ArrowIcon } from '@/components/ArrowIcon/ArrowIcon';
import { campaignListPath } from '@/routing/routes';
import styles from './Pagination.module.scss';

export function Pagination({ page, hasNext }: { page: number; hasNext: boolean }) {
  return (
    <nav className={styles.pagination} aria-label="Campaign pages">
      {page > 1 ? (
        <Link to={campaignListPath(page - 1)} aria-label="Previous page">
          <ArrowIcon direction="left" />
        </Link>
      ) : (
        <span aria-hidden="true">
          <ArrowIcon direction="left" />
        </span>
      )}

      <span className={styles.page} aria-current="page">
        Page {page}
      </span>

      {hasNext ? (
        <Link to={campaignListPath(page + 1)} aria-label="Next page">
          <ArrowIcon direction="right" />
        </Link>
      ) : (
        <span aria-hidden="true">
          <ArrowIcon direction="right" />
        </span>
      )}
    </nav>
  );
}
