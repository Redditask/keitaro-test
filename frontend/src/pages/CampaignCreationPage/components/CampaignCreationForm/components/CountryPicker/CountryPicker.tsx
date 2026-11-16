import { useState } from 'react';
import { Combobox } from '@/components/Combobox/Combobox';
import { formatCountryLabel, searchCountries } from '../../../../utils/countries';
import type { Country } from '../../../../utils/countries';
import styles from './CountryPicker.module.scss';

export function CountryPicker({
  countries,
  onChange,
  disabled,
}: {
  countries: Country[];
  onChange: (countries: Country[]) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const selectedCodes = new Set(countries.map(({ code }) => code));
  const options = searchCountries(query).filter(({ code }) => !selectedCodes.has(code));

  return (
    <div className={styles.picker}>
      <Combobox
        label="Countries for Google redirect"
        placeholder="Search countries"
        value={query}
        options={options}
        getKey={(country) => country.code}
        renderOption={(country) => (
          <>
            <span>{country.name}</span>
            <span>{country.code}</span>
          </>
        )}
        status={options.length ? '' : 'No matching countries.'}
        onValueChange={setQuery}
        onSelect={(country) => {
          onChange([...countries, country]);
          setQuery('');
        }}
        disabled={disabled}
      />

      {countries.length > 0 && (
        <ul className={styles.countries} aria-label="Selected countries">
          {countries.map((country) => (
            <li key={country.code}>
              <button
                type="button"
                className={styles.chip}
                aria-label={`Remove ${formatCountryLabel(country)}`}
                onClick={() => onChange(countries.filter(({ code }) => code !== country.code))}
                disabled={disabled}
              >
                <span>{formatCountryLabel(country)}</span>
                <span className={styles.removeIcon} aria-hidden="true">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
