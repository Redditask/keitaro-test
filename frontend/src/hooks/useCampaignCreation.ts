import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useReducer } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  campaignListKey,
  createCampaign,
  fetchCampaignOptions,
} from '@/api/campaigns/campaigns.api';
import type { Offer } from '@/entities/offer';
import type { Country } from '@/pages/CampaignCreationPage/utils/countries';
import { useUnsavedChanges } from './useUnsavedChanges';

interface CampaignCreationFields {
  name: string;
  countries: Country[];
  offer: Offer | null;
  groupId: string;
  domainId: string;
  trafficSourceId: string;
}

interface CampaignCreationState {
  fields: CampaignCreationFields;
  validationError: string;
}

type CampaignCreationAction =
  | { type: 'fieldsChanged'; changes: Partial<CampaignCreationFields> }
  | { type: 'validationFailed'; message: string }
  | { type: 'submissionStarted' };

const initialState: CampaignCreationState = {
  fields: { name: '', countries: [], offer: null, groupId: '', domainId: '', trafficSourceId: '' },
  validationError: '',
};

function campaignCreationReducer(
  state: CampaignCreationState,
  action: CampaignCreationAction,
): CampaignCreationState {
  switch (action.type) {
    case 'fieldsChanged':
      return { ...state, fields: { ...state.fields, ...action.changes } };
    case 'validationFailed':
      return { ...state, validationError: action.message };
    case 'submissionStarted':
      return { ...state, validationError: '' };
  }
}

function isPositiveId(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

export function useCampaignCreation(listPath: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [{ fields, validationError }, dispatch] = useReducer(campaignCreationReducer, initialState);
  const { name, countries, offer, groupId, domainId, trafficSourceId } = fields;

  const options = useQuery({
    queryKey: ['campaign-options'],
    queryFn: ({ signal }) => fetchCampaignOptions(signal),
  });

  const creation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignListKey });
    },
  });

  const dirty = Boolean(
    name || countries.length || offer || groupId || domainId || trafficSourceId,
  );
  const blocker = useUnsavedChanges(!creation.isSuccess && (dirty || creation.isPending));
  const locked = creation.isPending || creation.isSuccess;

  useEffect(() => {
    if (creation.data) {
      void navigate(listPath, { replace: true, state: { created: creation.data } });
    }
  }, [creation.data, listPath, navigate]);

  function changeFields(changes: Partial<CampaignCreationFields>) {
    dispatch({ type: 'fieldsChanged', changes });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked || !options.data) return;

    const trimmedName = name.trim();
    const group = Number(groupId);
    const domain = Number(domainId);
    const trafficSource = Number(trafficSourceId);

    if (!trimmedName || !countries.length || !offer || !isPositiveId(offer.id)) {
      dispatch({
        type: 'validationFailed',
        message: 'Enter a name, then choose at least one country and an offer.',
      });
      return;
    }

    if (![group, domain, trafficSource].every(isPositiveId)) {
      dispatch({
        type: 'validationFailed',
        message: 'Choose a group, a domain, and a traffic source.',
      });
      return;
    }

    dispatch({ type: 'submissionStarted' });
    creation.mutate({
      name: trimmedName,
      country_codes: countries.map(({ code }) => code),
      offer_id: offer.id,
      group_id: group,
      domain_id: domain,
      traffic_source_id: trafficSource,
    });
  }

  return {
    fields,
    changeFields,
    options,
    validationError,
    creationError: creation.error,
    isCreating: creation.isPending,
    locked,
    blocker,
    submit,
  };
}
