import { none, State, useState } from '@hookstate/core';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { MarketingMediaLinkWrite, MarketingMediaRole } from 'shared/generated';
import { Validation } from 'shared/utilities/Validation';

function Link({ link }: { link: State<MarketingMediaLinkWrite> }) {
  const state = useState(link);

  return (
    <FormGroup onRemove={() => state.set(none)}>
      <FormHorizontal state={state.role} name="Role">
        <FormSelect
          state={state.role}
          options={[
            {
              label: 'Additional Resources',
              value: MarketingMediaRole.Example,
            },
            {
              label: 'Embed',
              value: MarketingMediaRole.Embed,
            },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal state={state.label} name="Label">
        <FormText state={state.label} />
      </FormHorizontal>
      <FormHorizontal state={state.url} name="URL">
        <FormText state={state.url} />
      </FormHorizontal>
    </FormGroup>
  );
}

export default function VendorServiceMarketingLinks() {
  const { write } = useContext(ServiceContext);
  const state = useState(write.marketing.links);

  const links = state.map((image, index) => <Link link={state[index]} key={index} />);

  return (
    <div>
      <div className="space-y">{links}</div>
      <Button
        className="mt"
        onClick={() => {
          state.merge([{} as unknown as MarketingMediaLinkWrite]);
        }}
        disabled={!Validation(state).valid(true)}
      >
        Add Link
      </Button>
    </div>
  );
}
