import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/api/client';
import { searchOffers } from '@/api/offers/offers.api';
import { Combobox } from '@/components/Combobox/Combobox';
import type { Offer } from '@/entities/offer';
import styles from './OfferSearch.module.scss';

export function OfferSearch({
  selected = null,
  onSelect,
  onClear,
  disabled = false,
}: {
  selected?: Offer | null;
  onSelect: (offer: Offer) => void;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');

  const search = input.trim();
  const waiting = search !== term;

  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search), 230);

    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: ['offers', term],
    queryFn: ({ signal }) => searchOffers(term, signal),
    enabled: Boolean(term) && !waiting && !disabled && !selected,
    staleTime: 20_000,
  });

  const options = waiting || selected ? [] : (query.data ?? []);
  let status = '';
  if (!selected) {
    if (!search) status = 'Enter an offer name or ID.';
    else if (waiting || (query.isPending && !query.error)) status = 'Searching…';
    else if (query.error) status = errorMessage(query.error);
    else if (!options.length) status = 'No offers found.';
  }

  return (
    <Combobox
      label="Offer"
      placeholder="Search offers"
      value={selected?.name ?? input}
      hasSelection={selected !== null}
      options={options}
      getKey={(offer) => offer.id}
      renderOption={(offer) => (
        <>
          <span>{offer.name}</span>
          <span className={styles.offerId}>#{offer.id}</span>
        </>
      )}
      status={status}
      onValueChange={(value) => {
        if (selected) onClear?.();
        setInput(value);
      }}
      onSelect={(offer) => {
        onSelect(offer);
        setInput('');
      }}
      disabled={disabled}
    />
  );
}
