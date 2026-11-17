import { ApiError } from '@/api/client';

export function creationErrorDetails(error: Error): string[] {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== 'object') {
    return [];
  }

  const {
    reason,
    step,
    upstream_status: upstreamStatus,
    fields,
    alias,
    campaign_id: campaignId,
  } = error.details as Record<string, unknown>;

  const context: string[] = [];

  if (typeof step === 'string' && step) {
    context.push(`Stage — ${step.replaceAll('_', ' ')}`);
  }

  if (typeof upstreamStatus === 'number') {
    context.push(`Keitaro — HTTP ${upstreamStatus}`);
  }

  if (Array.isArray(fields)) {
    const fieldNames = fields
      .filter((field): field is string => typeof field === 'string')
      .map((field) => field.replaceAll('_', ' '));

    if (fieldNames.length > 0) {
      context.push(`Fields — ${fieldNames.join(', ')}`);
    }
  }

  const campaign: string[] = [];

  if (typeof alias === 'string' && alias) {
    campaign.push(`Alias — ${alias}`);
  }

  if (typeof campaignId === 'number') {
    campaign.push(`Campaign ID — ${campaignId}`);
  }

  const reasonText = typeof reason === 'string' ? reason : '';

  return [reasonText, context.join(' · '), campaign.join(' · ')].filter(Boolean);
}
