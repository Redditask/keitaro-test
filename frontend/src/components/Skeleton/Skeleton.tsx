import styles from './Skeleton.module.scss';

export function Skeleton({ width, height }: { width: string; height: string }) {
  return <span className={styles.block} style={{ width, height }} aria-hidden="true" />;
}
