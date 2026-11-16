import { Button } from '@/components/Button/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';
import { InlineMessage } from '@/components/InlineMessage/InlineMessage';
import { LeaveConfirmDialog } from '@/components/LeaveConfirmDialog/LeaveConfirmDialog';
import { OfferSearch } from '@/components/OfferSearch/OfferSearch';
import type { CampaignStreams } from '@/entities/stream';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useCampaignEditor } from '@/hooks/useCampaignEditor';
import { OfferTable } from '../OfferTable/OfferTable';
import { StreamPicker } from '../StreamPicker/StreamPicker';
import { PublicationActions } from './components/PublicationActions/PublicationActions';
import { ReadOnlyStreamDetails } from './components/ReadOnlyStreamDetails/ReadOnlyStreamDetails';
import styles from './CampaignEditor.module.scss';

const confirmations = {
  refresh: {
    title: 'Refresh stream?',
    description: 'Loading the stream from Keitaro will discard its unpublished changes.',
    confirmLabel: 'Refresh',
  },
  cancel: {
    title: 'Discard changes?',
    description: 'The stream will return to its last loaded or published version.',
    confirmLabel: 'Discard changes',
  },
  publish: {
    title: 'Publish offers?',
    description:
      'Publishing replaces the offer list and shares for this stream in Keitaro, including any changes made there.',
    confirmLabel: 'Publish',
  },
};

export function CampaignEditor({ initial }: { initial: CampaignStreams }) {
  const editor = useCampaignEditor(initial);
  const blocker = useUnsavedChanges(editor.hasChanges || editor.pending);
  const { campaign } = initial;
  const { stream, confirmation, pending } = editor;

  return (
    <>
      <p className={styles.campaign}>
        <strong>{campaign.name}</strong> <span>#{campaign.id}</span>
      </p>

      {stream ? (
        <>
          <div className={styles.workspace}>
            <StreamPicker
              streams={editor.streams}
              selectedId={stream.id}
              onSelect={editor.selectStream}
              disabled={pending}
            />
            <div className={styles.content} aria-busy={pending}>
              <div className={styles.toolbar}>
                <h2>{stream.is_editable ? 'Offers' : stream.name}</h2>
                <Button size="compact" disabled={pending} onClick={editor.refreshStream}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 4v6h-6m6 0-2.6-3A8.5 8.5 0 1 0 20 16" />
                  </svg>
                  {editor.refreshing ? 'Refreshing…' : 'Refresh stream'}
                </Button>
              </div>

              {editor.streamFeedback && (
                <InlineMessage tone={editor.streamFeedback.tone}>
                  {editor.streamFeedback.message}
                </InlineMessage>
              )}

              {stream.is_editable ? (
                <>
                  <OfferSearch
                    key={stream.id}
                    disabled={pending}
                    onSelect={(offer) => editor.editOffer({ type: 'add', offer })}
                  />

                  {editor.offerFeedback && (
                    <InlineMessage tone={editor.offerFeedback.tone}>
                      {editor.offerFeedback.message}
                    </InlineMessage>
                  )}

                  <OfferTable offers={editor.offers} disabled={pending} onEdit={editor.editOffer} />
                </>
              ) : (
                <ReadOnlyStreamDetails stream={stream} />
              )}
            </div>
          </div>

          {stream.is_editable && (
            <PublicationActions
              dirty={editor.dirty}
              pending={pending}
              publishing={editor.publishing}
              feedback={editor.publishFeedback}
              onCancel={() => editor.setConfirmation('cancel')}
              onPublish={() => editor.setConfirmation('publish')}
            />
          )}
        </>
      ) : (
        <InlineMessage>This campaign has no streams.</InlineMessage>
      )}

      <ConfirmDialog
        open={confirmation !== undefined}
        {...confirmations[confirmation ?? 'publish']}
        onConfirm={editor.confirm}
        onCancel={() => editor.setConfirmation(undefined)}
      />

      <LeaveConfirmDialog
        blocker={blocker}
        pending={pending}
        description="Unpublished changes in all streams will be lost."
      />
    </>
  );
}
