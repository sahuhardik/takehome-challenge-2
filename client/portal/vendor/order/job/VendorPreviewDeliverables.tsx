import DeliverablePreview from 'client/global/components/model/DeliverablePreview';
import Link from 'client/global/components/tailwind/Link';
import { DeliverableCard } from 'client/portal/vendor/order/job/DeliverableCard';
import * as React from 'react';
import { ReactNode, useRef } from 'react';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { JobStage, VendorDeliverToBueryDocument, VendorJobDetailQuery } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import UploadIcon from 'shared/icons/UploadIcon';
import VideoIcon from 'shared/icons/VideoIcon';

function DeleteDeliverableAssetBtn({ onPress }: { onPress: () => void }) {
  return (
    <PromiseButton
      className={'mt-5'}
      snackbar={false}
      icon={<DeleteIcon />}
      style={ButtonStyle.DANGER}
      onClick={onPress}
    >
      Delete Current Item
    </PromiseButton>
  );
}

function DeliverToBuyerBtn({ jobId, refreshJobDetail }: { jobId: string; refreshJobDetail: () => Promise<void> }) {
  const deliverToBuyer = useMutationPromise(VendorDeliverToBueryDocument);
  return (
    <ConfirmationButton
      title="Deliver all to buyer"
      className="mt mb"
      confirmText="Confirm"
      slim
      right
      icon={<UploadIcon />}
      description="Are you sure you want to push all deliverables to buyer portal?"
      onClick={() => {
        deliverToBuyer({ jobId });
        refreshJobDetail();
      }}
      style={ButtonStyle.PRIMARY}
    >
      Deliver All
    </ConfirmationButton>
  );
}

export default function VendorPreviewDeliverables({
  job,
  deleteDeliverable,
  refreshJobDetail,
}: {
  job: VendorJobDetailQuery['orderJob'];
  deleteDeliverable: (deliverableId: string) => Promise<void>;
  refreshJobDetail: () => Promise<void>;
}) {
  const refImgGallery = useRef(null);

  const containsDeliverablesToDeliver = () => {
    for (const deliverable of job.deliverables) {
      if (!job.buyerDeliverables.find((buyerDeliverable) => buyerDeliverable.id === deliverable.id)) {
        return true;
      }
    }
    return false;
  };

  if (job.deliverables.length === 0) {
    return <div>No assets have been delivered for this job.</div>;
  }

  const showDeliverToBuyerBtn = containsDeliverablesToDeliver();

  if (job.deliverables.every((d) => d.__typename === 'DeliverableImage') && job.stage !== JobStage.ReviewVendor) {
    return (
      <>
        {showDeliverToBuyerBtn && <DeliverToBuyerBtn jobId={job.id} refreshJobDetail={refreshJobDetail} />}
        <ImageGallery
          ref={refImgGallery}
          items={job.deliverables.map((d) => {
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
        <DeleteDeliverableAssetBtn
          onPress={() => deleteDeliverable(job.deliverables[refImgGallery?.current.getCurrentIndex()].id)}
        />
      </>
    );
  }

  return (
    <div>
      {showDeliverToBuyerBtn && <DeliverToBuyerBtn jobId={job.id} refreshJobDetail={refreshJobDetail} />}
      {job.deliverables
        .map((deliverable): [typeof job.deliverables[0], ReactNode] => {
          if (deliverable.__typename === 'DeliverableLink') {
            return [
              deliverable,
              <div key={deliverable.id}>
                <a href={deliverable.link} target="_blank" rel="noreferrer">
                  {deliverable.link}
                </a>
              </div>,
            ];
          }

          if (deliverable.__typename === 'DeliverableImage') {
            return [deliverable, <DeliverablePreview deliverable={deliverable} key="preview" />];
          }

          if (deliverable.__typename === 'DeliverableVideo' || deliverable.__typename === 'DeliverablePdf') {
            return [
              deliverable,
              <Link
                key={deliverable.id}
                icon={deliverable.mime.match(/video\/.*/) ? <VideoIcon /> : undefined}
                to={deliverable.preview}
              >
                {deliverable.name || deliverable.s3.split('/').pop()}
              </Link>,
            ];
          }

          if (deliverable.__typename === 'DeliverableText') {
            return [deliverable, <div key={deliverable.id}>{deliverable.text}</div>];
          }

          if (deliverable.__typename === 'DeliverableMatterport') {
            return [
              deliverable,
              <div key={deliverable.id}>
                <b>Branded:</b> {deliverable.brandedUrl}
                <br />
                <b>Unbranded:</b> {deliverable.unbrandedUrl}
              </div>,
            ];
          }
        })
        .filter((a) => a !== null)
        .map(([deliverable, view]) => (
          <DeliverableCard
            inReview={job.stage === JobStage.ReviewVendor}
            key={deliverable.id}
            deliverable={deliverable}
            refreshJobDetail={refreshJobDetail}
            vendorId={job.order.vendorId}
          >
            {view}
            <DeleteDeliverableAssetBtn
              onPress={() => {
                deleteDeliverable(deliverable.id);
              }}
            />
          </DeliverableCard>
        ))}
    </div>
  );
}
