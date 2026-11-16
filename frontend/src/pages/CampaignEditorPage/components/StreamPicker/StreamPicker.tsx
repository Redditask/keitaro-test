import type { CampaignStream } from '@/entities/stream';
import styles from './StreamPicker.module.scss';

export function StreamPicker({
  streams,
  selectedId,
  onSelect,
  disabled,
}: {
  streams: CampaignStream[];
  selectedId: number;
  onSelect: (id: number) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.picker}>
      <div className={styles.desktop} aria-labelledby="stream-picker-label">
        <p id="stream-picker-label">Streams</p>

        <ul>
          {streams.map((stream) => (
            <li key={stream.id}>
              <button
                type="button"
                aria-pressed={stream.id === selectedId}
                disabled={disabled}
                onClick={() => onSelect(stream.id)}
              >
                {stream.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <label className={styles.mobile}>
        <span>Stream</span>
        <select
          disabled={disabled}
          value={selectedId}
          onChange={(event) => onSelect(Number(event.currentTarget.value))}
        >
          {streams.map((stream) => (
            <option key={stream.id} value={stream.id}>
              {stream.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
