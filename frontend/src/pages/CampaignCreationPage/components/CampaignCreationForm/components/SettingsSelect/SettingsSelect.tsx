import { useId } from 'react';
import type { CampaignOption } from '@/entities/campaign';
import styles from './SettingsSelect.module.scss';

export function SettingsSelect({
  label,
  placeholder,
  items,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  items: CampaignOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        required
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {items.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
