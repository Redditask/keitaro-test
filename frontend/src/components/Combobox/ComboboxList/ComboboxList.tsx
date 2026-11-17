import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './ComboboxList.module.scss';

interface ComboboxListProps<Item> {
  id: string;
  label: string;
  expanded: boolean;
  activeIndex: number;
  options: Item[];
  getKey: (item: Item) => string | number;
  renderOption: (item: Item) => ReactNode;
  status: string;
  onSelect: (item: Item) => void;
}

export function ComboboxList<Item>({
  id,
  label,
  expanded,
  activeIndex,
  options,
  getKey,
  renderOption,
  status,
  onSelect,
}: ComboboxListProps<Item>) {
  const activeOptionRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div className={styles.popup} hidden={!expanded}>
      <ul id={id} className={styles.options} role="listbox" aria-label={label}>
        {expanded &&
          options.map((item, index) => (
            <li
              key={getKey(item)}
              id={`${id}-${index}`}
              ref={index === activeIndex ? activeOptionRef : undefined}
              className={styles.option}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
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
  );
}
