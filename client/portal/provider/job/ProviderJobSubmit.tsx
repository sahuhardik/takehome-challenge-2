import ProviderJobLink from 'client/portal/provider/job/ProviderJobLink';
import ProviderJobMatterport from 'client/portal/provider/job/ProviderJobMatterport';
import ProviderJobText from 'client/portal/provider/job/ProviderJobText';
import providerJobUploadFile from 'client/portal/provider/job/ProviderJobUploadFile';
import ProviderJobUploadImage from 'client/portal/provider/job/ProviderJobUploadImage';
import * as React from 'react';
import { DeliverableType, PerformableInputType, ProviderJobDetailGetQuery } from 'shared/generated';

const inputComponentsMap = {
  [PerformableInputType.Image]: ProviderJobUploadImage,
  [PerformableInputType.Text]: ProviderJobText,
  [PerformableInputType.Video]: providerJobUploadFile(DeliverableType.Video),
  [PerformableInputType.Pdf]: providerJobUploadFile(DeliverableType.Pdf),
  [PerformableInputType.Link]: ProviderJobLink,
  [PerformableInputType.Matterport]: ProviderJobMatterport,
};

export default function ProviderJobSubmit({ job }: { job: ProviderJobDetailGetQuery['orderJob'] }) {
  const Component = inputComponentsMap[job?.performable?.inputType];

  if (!Component) {
    return <div>Not Implemented</div>;
  }

  return <Component job={job} />;
}
