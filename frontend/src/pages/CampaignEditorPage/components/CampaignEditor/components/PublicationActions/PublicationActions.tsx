import { Button } from '@/components/Button/Button';
import { InlineMessage } from '@/components/InlineMessage/InlineMessage';
import type { EditorFeedback } from '@/hooks/useCampaignEditor';
import styles from './PublicationActions.module.scss';

interface PublicationActionsProps {
  dirty: boolean;
  pending: boolean;
  publishing: boolean;
  feedback?: EditorFeedback;
  onCancel: () => void;
  onPublish: () => void;
}

export function PublicationActions({
  dirty,
  pending,
  publishing,
  feedback,
  onCancel,
  onPublish,
}: PublicationActionsProps) {
  return (
    <div className={styles.footer}>
      <div className={styles.status}>
        {feedback ? (
          <InlineMessage tone={feedback.tone} variant="compact">
            {feedback.message}
          </InlineMessage>
        ) : dirty ? (
          <p className={styles.dirty} role="status">
            Unpublished changes
          </p>
        ) : (
          <p>No changes</p>
        )}
      </div>

      <div className={styles.actions}>
        <Button disabled={!dirty || pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!dirty || pending} onClick={onPublish}>
          {publishing ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </div>
  );
}
