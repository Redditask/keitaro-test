import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, errorMessage } from '@/api/client';
import { publishOffers, syncCampaign } from '@/api/editor/editor.api';
import type { CampaignStream, CampaignStreams, StreamOffer } from '@/entities/stream';
import {
  editOffers,
  offersDiffer,
  publicationPayload,
} from '@/pages/CampaignEditorPage/utils/offerDraft';
import type { OfferEdit } from '@/pages/CampaignEditorPage/utils/offerDraft';

export type EditorFeedback = { tone: 'error' | 'warning' | 'success'; message: string };

function initialStreamId(streams: CampaignStream[]) {
  return streams.find(({ is_editable }) => is_editable)?.id ?? streams[0]?.id ?? null;
}

export function useCampaignEditor(initial: CampaignStreams) {
  const [streams, setStreams] = useState(initial.streams);
  const [selectedId, setSelectedId] = useState(() => initialStreamId(initial.streams));
  const [drafts, setDrafts] = useState<Record<number, StreamOffer[]>>({});
  const [offerFeedback, setOfferFeedback] = useState<EditorFeedback>();
  const [streamFeedback, setStreamFeedback] = useState<EditorFeedback>();
  const [publishFeedback, setPublishFeedback] = useState<EditorFeedback>();
  const [confirmation, setConfirmation] = useState<'publish' | 'refresh' | 'cancel'>();

  const stream = streams.find(({ id }) => id === selectedId);
  const offers = stream ? (drafts[stream.id] ?? stream.offers) : [];
  const dirty = stream ? offersDiffer(stream.offers, offers) : false;
  const hasChanges = streams.some(
    ({ id, offers }) => drafts[id] && offersDiffer(offers, drafts[id]),
  );

  function updateDraft(streamId: number, offers?: StreamOffer[]) {
    setDrafts((previous) => {
      const next = { ...previous };
      if (offers) next[streamId] = offers;
      else delete next[streamId];
      return next;
    });
  }

  function updateStream(updated: CampaignStream) {
    setStreams((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    updateDraft(updated.id);
  }

  const refresh = useMutation({
    mutationFn: async (id: number) => {
      const fresh = await syncCampaign(initial.campaign.id);
      const updated = fresh.streams.find((item) => item.id === id);
      if (!updated) {
        throw new ApiError(
          'The selected stream no longer exists in Keitaro. Reopen the campaign.',
          'stream_changed',
        );
      }
      return updated;
    },
    onSuccess: (updated) => {
      updateStream(updated);
      setOfferFeedback(undefined);
      setPublishFeedback(undefined);
    },
    onError: (error) => setStreamFeedback({ tone: 'error', message: errorMessage(error) }),
  });

  const publication = useMutation({
    mutationFn: ({ id, offers }: { id: number; offers: StreamOffer[] }) =>
      publishOffers(initial.campaign.id, id, { offers: publicationPayload(offers) }),
    onSuccess: (updated) => {
      updateStream(updated);
      setOfferFeedback(undefined);
      setPublishFeedback({ tone: 'success', message: 'Offers published to Keitaro.' });
    },
    onError: (error) => {
      const unconfirmed = error instanceof ApiError && error.code === 'publication_unconfirmed';
      setPublishFeedback({
        tone: unconfirmed ? 'warning' : 'error',
        message: `${errorMessage(error)} Your changes are still in the editor.`,
      });
    },
  });

  const pending = refresh.isPending || publication.isPending;

  function selectStream(id: number) {
    if (pending) return;

    setSelectedId(id);
    setOfferFeedback(undefined);

    setStreamFeedback(undefined);
    setPublishFeedback(undefined);
  }

  function editOffer(edit: OfferEdit) {
    if (!stream?.is_editable || pending) return;

    setPublishFeedback(undefined);

    const result = editOffers(stream.offers, offers, edit);

    if ('error' in result) {
      setOfferFeedback({ tone: 'error', message: result.error });
      return;
    }

    setOfferFeedback(result.notice ? { tone: 'warning', message: result.notice } : undefined);
    updateDraft(stream.id, result.offers);
  }

  function refreshStream() {
    if (!stream || pending) return;
    if (dirty) setConfirmation('refresh');
    else {
      setStreamFeedback(undefined);
      refresh.mutate(stream.id);
    }
  }

  function confirm() {
    if (!stream || pending) return;
    setConfirmation(undefined);

    switch (confirmation) {
      case 'refresh':
        setStreamFeedback(undefined);
        refresh.mutate(stream.id);

        break;
      case 'publish':
        setPublishFeedback(undefined);
        publication.mutate({ id: stream.id, offers });

        break;
      case 'cancel':
        updateDraft(stream.id);
        setOfferFeedback(undefined);
        setPublishFeedback(undefined);

        break;
    }
  }

  return {
    streams,
    stream,
    offers,
    dirty,
    hasChanges,
    pending,
    refreshing: refresh.isPending,
    publishing: publication.isPending,
    offerFeedback,
    streamFeedback,
    publishFeedback,
    confirmation,
    setConfirmation,
    confirm,
    selectStream,
    editOffer,
    refreshStream,
  };
}
