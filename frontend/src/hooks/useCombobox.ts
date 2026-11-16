import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

interface ComboboxInteraction<Item> {
  options: Item[];
  getKey: (item: Item) => string | number;
  value: string;
  hasSelection: boolean;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onSelect: (item: Item) => void;
}

export function useCombobox<Item>({
  options,
  getKey,
  value,
  hasSelection,
  disabled,
  onValueChange,
  onSelect,
}: ComboboxInteraction<Item>) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | number>();
  const activeOptionRef = useRef<HTMLLIElement>(null);

  const expanded = open && !disabled && !hasSelection;
  const activeIndex = expanded ? options.findIndex((item) => getKey(item) === activeKey) : -1;

  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

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

  function changeValue(value: string) {
    openList();
    setActiveKey(undefined);
    onValueChange(value);
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

  return {
    expanded,
    activeIndex,
    activeOptionRef,
    openList,
    closeList,
    selectOption,
    changeValue,
    handleKeyDown,
  };
}
