import { useState } from '@hookstate/core';
import { FileUploadProps } from 'client/global/components/FileUpload';
import Card from 'client/global/components/tailwind/Card';
import Lightbox from 'client/global/components/tailwind/Lightbox';
import * as React from 'react';
import { lazy } from 'react';
import { AlertState } from 'shared/components/alert';
import { AttachmentDetailsFragment, VendorAttachmentDownloadDocument } from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';
const FileUpload = lazy(() => import(/* webpackChunkName: "uppy" */ 'client/global/components/FileUpload'));

interface UploadState {
  images: { s3: string; mime: string; name: string }[];
  uploading: boolean;
  remaining: number;
  uploaded: boolean;
}

function Uploaded({ attachments }: Pick<IProps, 'attachments'>) {
  const downloadUrl = useQueryPromise(VendorAttachmentDownloadDocument);

  return (
    <div className="space-y mt">
      {attachments.map(({ url, mime }, idx) => (
        <Card key={idx}>
          <div
            className="flex items-center space-x cursor-pointer"
            onClick={async () => window.open((await downloadUrl({ s3Url: url })).vendorAttachmentDownload, '_blank')}
          >
            <Lightbox src={url} mime={mime} sizes={[150, '25vw']} />
            <div className="flex-1">
              <strong>File:</strong> {url.split('/').pop()}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface IProps {
  meta: Record<string, string>;
  attachments: AttachmentDetailsFragment[];
  onUpload: (file: Parameters<FileUploadProps['onUpload']>['0']) => Promise<unknown>;
}

export function VendorAttachments({ meta, attachments, onUpload }: IProps) {
  const state = useState<UploadState>({
    images: [],
    uploading: false,
    uploaded: false,
    remaining: 0,
  });

  return (
    <div className="pt w-full">
      <FileUpload
        meta={meta}
        multiple
        onStart={state.remaining.set}
        onUpload={(file) => {
          onUpload(file)
            .then(() => {
              state.merge((old) => ({
                images: [...old.images, file],
                uploading: true,
                remaining: old.remaining - 1,
              }));
            })
            .catch(() => {
              AlertState.merge({
                show: true,
                severity: 'error',
              });
            });
        }}
      />
      <Uploaded attachments={attachments} />
    </div>
  );
}
