import type { StreamOffer } from '@/entities/stream';
import type { OfferEdit } from '../../utils/offerDraft';
import { OfferTableRow } from './components/OfferTableRow/OfferTableRow';
import styles from './OfferTable.module.scss';

export function OfferTable({
  offers,
  disabled,
  onEdit,
}: {
  offers: StreamOffer[];
  disabled: boolean;
  onEdit: (edit: OfferEdit) => void;
}) {
  if (!offers.length) return <p className={styles.empty}>This stream has no offers.</p>;

  return (
    <table className={styles.table} aria-label="Stream offers" role="table">
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">
            Offer
          </th>
          <th role="columnheader" scope="col">
            Share
          </th>
          <th role="columnheader" scope="col">
            Actions
          </th>
        </tr>
      </thead>

      <tbody role="rowgroup">
        {offers.map((offer) => (
          <OfferTableRow key={offer.offer_id} offer={offer} disabled={disabled} onEdit={onEdit} />
        ))}
      </tbody>
    </table>
  );
}
