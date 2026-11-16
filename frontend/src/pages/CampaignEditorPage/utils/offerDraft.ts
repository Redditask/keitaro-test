import type { Offer } from '@/entities/offer';
import type { PublishedOffer, StreamOffer } from '@/entities/stream';

export type OfferEdit =
  { type: 'add'; offer: Offer } | { type: 'remove' | 'restore' | 'togglePin'; offerId: number };

type EditResult = { offers: StreamOffer[]; notice?: string } | { error: string };

export function editOffers(
  baseline: StreamOffer[],
  current: StreamOffer[],
  edit: OfferEdit,
): EditResult {
  if (edit.type === 'add' && current.some(({ offer_id }) => offer_id === edit.offer.id)) {
    return {
      error:
        'This offer is already in the stream. To bring back a removed offer, restore it from the list.',
    };
  }

  const changed =
    edit.type === 'add'
      ? [
          ...current,
          {
            offer_id: edit.offer.id,
            name: edit.offer.name,
            state: 'active' as const,
            share: 0,
            is_pinned: false,
          },
        ]
      : current.map((offer): StreamOffer => {
          if (offer.offer_id !== edit.offerId) return offer;
          switch (edit.type) {
            case 'remove':
              return { ...offer, state: 'removed', share: 0, is_pinned: false };
            case 'restore': {
              const original = baseline.find(({ offer_id }) => offer_id === offer.offer_id);
              return original?.state === 'disabled' ? original : { ...offer, state: 'active' };
            }
            case 'togglePin':
              return { ...offer, is_pinned: !offer.is_pinned };
          }
        });

  const visible =
    edit.type === 'remove' && !baseline.some(({ offer_id }) => offer_id === edit.offerId)
      ? changed.filter(({ offer_id }) => offer_id !== edit.offerId)
      : changed;
  const result = distributeShares(visible);
  if ('error' in result) return result;

  const added = edit.type === 'add' && result.offers.at(-1);
  return added && added.share === 0
    ? {
        ...result,
        notice: 'The new offer gets 0% because other offers already have all the traffic pinned.',
      }
    : result;
}

function distributeShares(offers: StreamOffer[]): EditResult {
  const active = offers.filter(({ state }) => state === 'active');
  const pinnedTotal = active.reduce(
    (total, offer) => total + (offer.is_pinned ? offer.share : 0),
    0,
  );
  const available = 100 - pinnedTotal;
  const automaticCount = active.filter(({ is_pinned }) => !is_pinned).length;

  if (available < 0) {
    return { error: 'Pinned shares would exceed 100%. Unpin another offer first.' };
  }
  if (active.length && !automaticCount && available > 0) {
    return {
      error: 'Some traffic would have no offer. Unpin at least one offer.',
    };
  }
  if (!automaticCount) return { offers };

  const share = Math.floor(available / automaticCount);
  const remainder = available % automaticCount;
  let index = 0;

  // Give rounding points to the last automatic offers in stream order.
  return {
    offers: offers.map((offer) =>
      offer.state === 'active' && !offer.is_pinned
        ? { ...offer, share: share + Number(index++ >= automaticCount - remainder) }
        : offer,
    ),
  };
}

export function offersDiffer(baseline: StreamOffer[], current: StreamOffer[]) {
  return (
    baseline.length !== current.length ||
    baseline.some((offer, index) => {
      const draft = current[index];
      return (
        offer.offer_id !== draft.offer_id ||
        offer.state !== draft.state ||
        offer.is_pinned !== draft.is_pinned ||
        offer.share !== draft.share
      );
    })
  );
}

export function publicationPayload(offers: StreamOffer[]): PublishedOffer[] {
  return offers.flatMap(({ offer_id, state, share, is_pinned }) =>
    state === 'removed' ? [] : [{ offer_id, state, share, is_pinned }],
  );
}
