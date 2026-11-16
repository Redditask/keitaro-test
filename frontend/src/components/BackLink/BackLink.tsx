import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import styles from './BackLink.module.scss';

export function BackLink({ children, ...props }: Omit<LinkProps, 'className'>) {
  return (
    <Link {...props} className={styles.link}>
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  );
}
