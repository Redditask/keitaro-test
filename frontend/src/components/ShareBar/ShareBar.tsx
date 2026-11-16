import styles from './ShareBar.module.scss';

export function ShareBar({ share, pinned = false }: { share: number; pinned?: boolean }) {
  const width = Math.max(0, Math.min(100, share));

  return (
    <span className={styles.track} data-pinned={pinned || undefined} aria-hidden="true">
      <span style={{ width: `${width}%` }} />
    </span>
  );
}
