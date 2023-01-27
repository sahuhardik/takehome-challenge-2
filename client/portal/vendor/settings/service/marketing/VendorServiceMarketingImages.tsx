import { none, State, useState } from '@hookstate/core';
import FormImage from 'client/global/components/form/FormImage';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { MarketingMediaImageWrite, MarketingMediaRole } from 'shared/generated';
import { Validation } from 'shared/utilities/Validation';

function Image({ image }: { image: State<MarketingMediaImageWrite> }) {
  const { vendorId } = useParams();
  const { read } = useContext(ServiceContext);
  const state = useState(image);

  return (
    <FormGroup onRemove={() => state.set(none)}>
      <FormHorizontal state={state.role} name="Role">
        <FormSelect
          state={state.role}
          options={[
            {
              label: 'Hero',
              value: MarketingMediaRole.Hero,
            },
            {
              label: 'Background',
              value: MarketingMediaRole.Background,
            },
            {
              label: 'Example',
              value: MarketingMediaRole.Example,
            },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal state={state.file} name="Image">
        <FormImage state={state.file} meta={{ vendorId, serviceId: read.id }} />
      </FormHorizontal>
    </FormGroup>
  );
}

export default function VendorServiceMarketingImages() {
  const { write } = useContext(ServiceContext);
  const state = useState(write.marketing.images);

  const images = state.map((image, index) => <Image image={state[index]} key={index} />);

  return (
    <div>
      <div className="space-y">{images}</div>
      <Button
        className="mt"
        onClick={() => {
          state.merge([{ file: {} } as MarketingMediaImageWrite]);
        }}
        disabled={!Validation(state).valid(true)}
      >
        Add Image
      </Button>
    </div>
  );
}
