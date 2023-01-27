import { none, State, useState } from '@hookstate/core';
import FormVideo from 'client/global/components/form/FormVideo';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import Button from 'shared/components/tailwind/Button';
import { MarketingMediaRole, MarketingMediaVideoWrite } from 'shared/generated';
import { Validation } from 'shared/utilities/Validation';

function Video({ video }: { video: State<MarketingMediaVideoWrite> }) {
  const { vendorId } = useParams();
  const { read } = useContext(ServiceContext);
  const state = useState(video);

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
      <FormHorizontal state={state.file} name="Video">
        <FormVideo state={state.file} meta={{ vendorId, serviceId: read.id }} />
      </FormHorizontal>
    </FormGroup>
  );
}

export default function VendorServiceMarketingVideos() {
  const { write } = useContext(ServiceContext);
  const state = useState(write.marketing.videos);

  const videos = state.map((video, index) => <Video video={state[index]} key={index} />);

  return (
    <div>
      {videos}
      <Button
        onClick={() => {
          state.merge([{ file: {} } as MarketingMediaVideoWrite]);
        }}
        disabled={!Validation(state).valid(true)}
      >
        Add Video
      </Button>
    </div>
  );
}
