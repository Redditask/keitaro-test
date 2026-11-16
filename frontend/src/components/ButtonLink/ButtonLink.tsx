import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import styles from '../Button/Button.module.scss';

export function ButtonLink(
  props: Omit<LinkProps, 'className'> & { variant?: 'default' | 'primary' },
) {
  const { variant = 'default', ...linkProps } = props;

  return <Link {...linkProps} className={styles.button} data-variant={variant} />;
}
