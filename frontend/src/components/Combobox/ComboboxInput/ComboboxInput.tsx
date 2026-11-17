import type { KeyboardEventHandler } from 'react';
import styles from './ComboboxInput.module.scss';

interface ComboboxInputProps {
  id: string;
  listId: string;
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  expanded: boolean;
  activeOptionId?: string;
  onOpen: () => void;
  onClose: () => void;
  onValueChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
}

export function ComboboxInput({
  id,
  listId,
  label,
  value,
  placeholder,
  disabled,
  expanded,
  activeOptionId,
  onOpen,
  onClose,
  onValueChange,
  onKeyDown,
}: ComboboxInputProps) {
  return (
    <div className={styles.input}>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="8.5" cy="8.5" r="4.6" />
        <path d="m12 12 4.25 4.25" />
      </svg>

      <input
        id={id}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={activeOptionId}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onFocus={onOpen}
        onClick={onOpen}
        onBlur={onClose}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
