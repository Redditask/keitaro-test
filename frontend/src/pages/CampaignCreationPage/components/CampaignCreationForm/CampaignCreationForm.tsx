import { errorMessage } from '@/api/client';
import { Button } from '@/components/Button/Button';
import { InlineMessage } from '@/components/InlineMessage/InlineMessage';
import { LeaveConfirmDialog } from '@/components/LeaveConfirmDialog/LeaveConfirmDialog';
import { OfferSearch } from '@/components/OfferSearch/OfferSearch';
import { useCampaignCreation } from '@/hooks/useCampaignCreation';
import { CountryPicker } from './components/CountryPicker/CountryPicker';
import { SettingsSelect } from './components/SettingsSelect/SettingsSelect';
import { creationErrorDetails } from './utils/creationErrorDetails';
import styles from './CampaignCreationForm.module.scss';

export function CampaignCreationForm({ listPath }: { listPath: string }) {
  const {
    fields,
    changeFields,
    options,
    validationError,
    creationError,
    isCreating,
    locked,
    blocker,
    submit,
  } = useCampaignCreation(listPath);

  const optionsDisabled = locked || !options.data;

  return (
    <>
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.field}>
          <label htmlFor="campaign-name">Name</label>
          <input
            id="campaign-name"
            type="text"
            value={fields.name}
            placeholder="test_aheika_campaign1"
            onChange={(event) => changeFields({ name: event.currentTarget.value })}
            disabled={locked}
            required
          />
        </div>

        <div className={styles.field}>
          <span>Countries</span>
          <CountryPicker
            countries={fields.countries}
            onChange={(countries) => changeFields({ countries })}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <span>Offer</span>
          <OfferSearch
            selected={fields.offer}
            onSelect={(offer) => changeFields({ offer })}
            onClear={() => changeFields({ offer: null })}
            disabled={locked}
          />
        </div>

        <SettingsSelect
          label="Group"
          placeholder={options.isPending ? 'Loading groups…' : 'Choose a group'}
          items={options.data?.groups ?? []}
          value={fields.groupId}
          onChange={(groupId) => changeFields({ groupId })}
          disabled={optionsDisabled}
        />

        <SettingsSelect
          label="Domain"
          placeholder={options.isPending ? 'Loading domains…' : 'Choose a domain'}
          items={options.data?.domains ?? []}
          value={fields.domainId}
          onChange={(domainId) => changeFields({ domainId })}
          disabled={optionsDisabled}
        />

        <SettingsSelect
          label="Traffic source"
          placeholder={options.isPending ? 'Loading sources…' : 'Choose a traffic source'}
          items={options.data?.traffic_sources ?? []}
          value={fields.trafficSourceId}
          onChange={(trafficSourceId) => changeFields({ trafficSourceId })}
          disabled={optionsDisabled}
        />

        {options.error && (
          <InlineMessage
            tone="error"
            actions={
              <Button
                size="compact"
                disabled={options.isFetching}
                onClick={() => void options.refetch()}
              >
                Retry
              </Button>
            }
          >
            {errorMessage(options.error)}
          </InlineMessage>
        )}

        {validationError ? (
          <InlineMessage tone="error">{validationError}</InlineMessage>
        ) : (
          creationError && (
            <InlineMessage tone="error">
              {errorMessage(creationError)}
              {creationErrorDetails(creationError).map((detail) => (
                <span className={styles.errorDetail} key={detail}>
                  {detail}
                </span>
              ))}
            </InlineMessage>
          )
        )}

        <div className={styles.actions}>
          <Button variant="primary" type="submit" disabled={optionsDisabled}>
            {isCreating ? 'Creating…' : 'Create campaign'}
          </Button>
        </div>
      </form>

      <LeaveConfirmDialog
        blocker={blocker}
        pending={isCreating}
        description="The information you entered will be lost."
      />
    </>
  );
}
