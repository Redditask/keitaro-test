import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  editOffers,
  offersDiffer,
  publicationPayload,
} from '../src/pages/CampaignEditorPage/utils/offerDraft.ts';
import type { StreamOffer } from '@/entities/stream.ts';

function offer(id: number, share: number, isPinned = false): StreamOffer {
  return { offer_id: id, name: `Offer ${id}`, state: 'active', share, is_pinned: isPinned };
}

function apply(...args: Parameters<typeof editOffers>) {
  const result = editOffers(...args);
  if ('error' in result) assert.fail(result.error);
  return result;
}

test('preserves a 25% pin and gives the rounding point to the last automatic offer', () => {
  const baseline = [offer(1, 25), offer(2, 25)];
  const { offers: pinned } = apply(baseline, baseline, { type: 'togglePin', offerId: 1 });
  const { offers } = apply(baseline, pinned, { type: 'add', offer: { id: 3, name: 'Offer 3' } });
  assert.deepEqual(
    offers.map(({ share }) => share),
    [25, 37, 38],
  );
  assert.deepEqual(
    baseline.map(({ share }) => share),
    [25, 25],
  );
});

test('an all-pinned stream gives a new offer zero traffic and explains why', () => {
  const baseline = [offer(1, 100, true)];
  const result = apply(baseline, baseline, { type: 'add', offer: { id: 2, name: 'Offer 2' } });
  assert.deepEqual(
    result.offers.map(({ share }) => share),
    [100, 0],
  );
  assert.match(result.notice ?? '', /0%/);
});

test('rejects a pin when it would leave part of the traffic unassigned', () => {
  const baseline = [offer(1, 25)];
  const result = editOffers(baseline, baseline, { type: 'togglePin', offerId: 1 });
  assert.ok('error' in result);
  assert.equal(baseline[0].is_pinned, false);
});

test('removed and disabled bindings preserve independent behavior', () => {
  const disabled: StreamOffer = { ...offer(3, 10), state: 'disabled' };
  const baseline = [offer(1, 50), offer(2, 50), disabled];

  const { offers: removed } = apply(baseline, baseline, { type: 'remove', offerId: 2 });
  assert.deepEqual(
    removed.map(({ state, share }) => [state, share]),
    [
      ['active', 100],
      ['removed', 0],
      ['disabled', 10],
    ],
  );
  assert.deepEqual(publicationPayload(removed), [
    { offer_id: 1, state: 'active', share: 100, is_pinned: false },
    { offer_id: 3, state: 'disabled', share: 10, is_pinned: false },
  ]);

  const { offers: restored } = apply(baseline, removed, { type: 'restore', offerId: 2 });
  assert.equal(offersDiffer(baseline, restored), false);
});

test('removing a newly added binding does not create local removed history', () => {
  const baseline = [offer(1, 100)];
  const { offers: added } = apply(baseline, baseline, {
    type: 'add',
    offer: { id: 2, name: 'Offer 2' },
  });
  const { offers: removed } = apply(baseline, added, { type: 'remove', offerId: 2 });
  assert.deepEqual(removed, baseline);
});

test('removing the last active offer is allowed', () => {
  const baseline = [offer(1, 100, true)];
  const { offers } = apply(baseline, baseline, { type: 'remove', offerId: 1 });
  assert.deepEqual(publicationPayload(offers), []);
});
