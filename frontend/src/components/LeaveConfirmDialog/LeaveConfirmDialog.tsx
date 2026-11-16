import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import type { Blocker } from 'react-router';

export function LeaveConfirmDialog({
  blocker,
  pending,
  description,
}: {
  blocker: Blocker;
  pending: boolean;
  description: string;
}) {
  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave this page?"
      description={pending ? 'Wait for the current operation to finish.' : description}
      confirmLabel="Leave"
      confirmDisabled={pending}
      cancelLabel="Stay"
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  );
}
