import { ShareBar } from '@/components/ShareBar/ShareBar';
import type { StreamOffer } from '@/entities/stream';
import type { OfferEdit } from '../../../../utils/offerDraft';
import styles from './OfferTableRow.module.scss';

export function OfferTableRow({
  offer,
  disabled,
  onEdit,
}: {
  offer: StreamOffer;
  disabled: boolean;
  onEdit: (edit: OfferEdit) => void;
}) {
  const { offer_id, name, state, share, is_pinned } = offer;
  const pinned = state === 'active' && is_pinned;
  const pinLabel = pinned ? 'Unpin' : 'Pin';
  const displayedShare = state === 'removed' ? 0 : share;

  return (
    <tr className={styles.row} data-state={state} role="row">
      <td className={styles.name} role="cell">
        <strong>{name}</strong>
        <span className={styles.id}>#{offer_id}</span>
        {state !== 'active' && (
          <span className={styles.state}>{state === 'removed' ? 'Removed' : 'Disabled'}</span>
        )}
      </td>

      <td className={styles.share} role="cell">
        <div className={styles.distribution}>
          <ShareBar share={displayedShare} pinned={pinned} />
          <span>{displayedShare}%</span>

          {pinned && (
            <span className={styles.pinned}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M5 7V5a3 3 0 0 1 6 0v2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M4 7h8a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 12 14H4a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 4 7Zm4 2.2a1 1 0 0 0-.5 1.87V12a.5.5 0 0 0 1 0v-.93A1 1 0 0 0 8 9.2Z"
                />
              </svg>
              Pinned
            </span>
          )}
        </div>
      </td>

      <td className={styles.actions} role="cell">
        <div>
          {state === 'removed' ? (
            <button
              type="button"
              disabled={disabled}
              aria-label={`Restore ${name}`}
              onClick={() => onEdit({ type: 'restore', offerId: offer_id })}
            >
              Restore
            </button>
          ) : (
            <>
              {state === 'active' && (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`${pinLabel} share for ${name}`}
                  onClick={() => onEdit({ type: 'togglePin', offerId: offer_id })}
                >
                  {pinLabel}
                </button>
              )}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${name}`}
                onClick={() => onEdit({ type: 'remove', offerId: offer_id })}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
