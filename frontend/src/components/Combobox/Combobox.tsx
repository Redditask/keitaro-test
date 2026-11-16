import { useId } from 'react';
import type { ReactNode } from 'react';
import { useCombobox } from '@/hooks/useCombobox';
import styles from './Combobox.module.scss';

interface ComboboxProps<Item> {
  label: string;
  placeholder: string;
  value: string;
  hasSelection?: boolean;
  options: Item[];
  getKey: (item: Item) => string | number;
  renderOption: (item: Item) => ReactNode;
  status: string;
  onValueChange: (value: string) => void;
  onSelect: (item: Item) => void;
  disabled?: boolean;
}

export function Combobox<Item>({
  label,
  placeholder,
  value,
  hasSelection = false,
  options,
  getKey,
  renderOption,
  status,
  onValueChange,
  onSelect,
  disabled = false,
}: ComboboxProps<Item>) {
  const id = useId();
  const listId = `${id}-list`;

  const interaction = useCombobox({
    options,
    getKey,
    value,
    hasSelection,
    disabled,
    onValueChange,
    onSelect,
  });
  const { expanded, activeIndex } = interaction;

  return (
    <div className={styles.control}>
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
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onFocus={interaction.openList}
          onClick={interaction.openList}
          onBlur={interaction.closeList}
          onChange={(event) => interaction.changeValue(event.currentTarget.value)}
          onKeyDown={interaction.handleKeyDown}
        />
      </div>

      <div className={styles.popup} hidden={!expanded}>
        <ul id={listId} className={styles.options} role="listbox" aria-label={label}>
          {expanded &&
            options.map((item, index) => (
              <li
                key={getKey(item)}
                id={`${listId}-${index}`}
                ref={index === activeIndex ? interaction.activeOptionRef : undefined}
                className={styles.option}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => interaction.selectOption(item)}
              >
                {renderOption(item)}
              </li>
            ))}
        </ul>

        {status && (
          <p className={styles.status} role="status">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
