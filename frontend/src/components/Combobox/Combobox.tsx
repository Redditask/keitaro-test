import { useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { ComboboxInput } from './ComboboxInput/ComboboxInput';
import { ComboboxList } from './ComboboxList/ComboboxList';
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

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | number>();

  const expanded = open && !disabled && !hasSelection;
  const activeIndex = expanded ? options.findIndex((item) => getKey(item) === activeKey) : -1;

  function openList() {
    setOpen(true);
  }

  function closeList() {
    setOpen(false);

    setActiveKey(undefined);
  }

  function selectOption(item: Item) {
    onSelect(item);

    closeList();
  }

  function changeValue(nextValue: string) {
    openList();

    setActiveKey(undefined);

    onValueChange(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || disabled || hasSelection) return;

    if (event.key === 'Escape' && expanded) {
      event.preventDefault();

      closeList();

      return;
    }

    if (event.key === 'Enter' && expanded && (activeIndex >= 0 || value)) {
      event.preventDefault();

      const item = options[Math.max(activeIndex, 0)];
      if (item !== undefined) selectOption(item);

      return;
    }

    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options.length) {
      event.preventDefault();

      openList();

      const nextIndex =
        event.key === 'ArrowDown'
          ? (activeIndex + 1) % options.length
          : (Math.max(activeIndex, 0) - 1 + options.length) % options.length;

      setActiveKey(getKey(options[nextIndex]));
    }
  }

  return (
    <div className={styles.control}>
      <ComboboxInput
        id={id}
        listId={listId}
        label={label}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        expanded={expanded}
        activeOptionId={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onOpen={openList}
        onClose={closeList}
        onValueChange={changeValue}
        onKeyDown={handleKeyDown}
      />

      <ComboboxList
        id={listId}
        label={label}
        expanded={expanded}
        activeIndex={activeIndex}
        options={options}
        getKey={getKey}
        renderOption={renderOption}
        status={status}
        onSelect={selectOption}
      />
    </div>
  );
}
