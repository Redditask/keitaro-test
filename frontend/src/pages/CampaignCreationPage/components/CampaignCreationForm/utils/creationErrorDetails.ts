import { ApiError } from '@/api/client';

export function creationErrorDetails(error: Error): string[] {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== 'object') {
    return [];
  }

  const { details } = error;
  const reason = 'reason' in details && typeof details.reason === 'string' ? details.reason : '';
  const step =
    'step' in details && typeof details.step === 'string' ? details.step.replaceAll('_', ' ') : '';
  const fields =
    'fields' in details && Array.isArray(details.fields)
      ? details.fields
          .filter((field): field is string => typeof field === 'string')
          .map((field) => field.replaceAll('_', ' '))
      : [];

  const context = [
    step && `Stage — ${step}`,
    'upstream_status' in details &&
      typeof details.upstream_status === 'number' &&
      `Keitaro — HTTP ${details.upstream_status}`,
    fields.length > 0 && `Fields — ${fields.join(', ')}`,
  ].filter(Boolean);
  const campaign = [
    'alias' in details && typeof details.alias === 'string' && `Alias — ${details.alias}`,
    'campaign_id' in details &&
      typeof details.campaign_id === 'number' &&
      `Campaign ID — ${details.campaign_id}`,
  ].filter(Boolean);

  return [reason, context.join(' · '), campaign.join(' · ')].filter(Boolean);
}
