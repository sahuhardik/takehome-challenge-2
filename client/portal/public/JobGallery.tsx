import { loaded } from 'client/global/components/tailwind/SpinnerLoader';
import * as React from 'react';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { useParams } from 'react-router-dom';
import Button from 'shared/components/tailwind/Button';
import { JobGalleryDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export function Inner() {
  const { jobId } = useParams();

  loaded();

  const { orderJob } = useQueryHook(JobGalleryDocument, { jobId });

  return (
    <>
      {orderJob.buyerCanDownload && (
        <div className="bg-red-500 w-24 m-2">
          <Button
            className="bg-blue-500"
            onClick={() => {
              window.open(`/api/buyer/${orderJob.order.buyer.id}/order/${orderJob.order.id}/job/${jobId}/download`);
            }}
          >
            Download
          </Button>
        </div>
      )}
      <ImageGallery
        items={orderJob.buyerDeliverables.map((d) => {
          if (d.__typename !== 'DeliverableImage') {
            return;
          }

          let replace = d.s3.replace('photog-upload.s3.us-east-1.amazonaws.com', 'photog.imgix.net');
          replace = replace.replace('photog-upload.s3.amazonaws.com', 'photog.imgix.net');
          replace = replace.replace('photog-upload.s3-accelerate.amazonaws.com', 'photog.imgix.net');
          replace = replace.replace('photog-test.s3.us-east-1.amazonaws.com', 'photog-test.imgix.net');
          replace = replace.replace('photog-test.s3-accelerate.amazonaws.com', 'photog-test.imgix.net');

          if (replace.includes('/private') && replace.includes('photog.imgix.net')) {
            replace = replace.replace('photog.imgix.net', 'photog-private.imgix.net');
          }

          return {
            original: `${replace}?auto=format,compress&fit=crop&q=70&w=2000`,
            thumbnail: `${replace}?auto=format,compress&fit=crop&q=10&w=512`,
          };
        })}
      />
    </>
  );
}

export default function JobGallery() {
  return (
    <div className="relative flex-1 flex items-center">
      <div className="w-full text-center font-bold">Loading, please wait...</div>
      <div className="z-20 w-full h-full absolute top-0 left-0 right-0 bottom-0">
        <React.Suspense fallback={<></>}>
          <Inner />
        </React.Suspense>
      </div>
    </div>
  );
}
