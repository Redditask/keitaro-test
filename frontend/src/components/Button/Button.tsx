import type { ComponentProps } from 'react';
import styles from './Button.module.scss';

type ButtonProps = Omit<ComponentProps<'button'>, 'className'> & {
  variant?: 'default' | 'primary';
  size?: 'default' | 'compact';
};

export function Button({
  type = 'button',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={styles.button}
      data-variant={variant}
      data-size={size}
    />
  );
}
