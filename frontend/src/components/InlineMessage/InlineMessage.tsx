import type { ReactNode } from 'react';
import styles from './InlineMessage.module.scss';

export function InlineMessage({
  children,
  actions,
  tone = 'neutral',
  variant = 'block',
}: {
  children: ReactNode;
  actions?: ReactNode;
  tone?: 'error' | 'warning' | 'success' | 'neutral';
  variant?: 'block' | 'compact';
}) {
  return (
    <div className={styles.message} data-tone={tone} data-variant={variant}>
      <span role={tone === 'error' ? 'alert' : 'status'}>{children}</span>
      {actions}
    </div>
  );
}
