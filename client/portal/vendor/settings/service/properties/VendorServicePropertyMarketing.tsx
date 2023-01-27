import { none, State, useState } from '@hookstate/core';
import { ButtonGroup } from 'client/global/components/button/ButtonGroup';
import SlidebarOpenButton, { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import FormImage from 'client/global/components/form/FormImage';
import FormVideo from 'client/global/components/form/FormVideo';
import Card from 'client/global/components/tailwind/Card';
import Lightbox from 'client/global/components/tailwind/Lightbox';
import Link from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { Tab } from 'client/global/components/tailwind/Tabs';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  MarketingMediaImageWrite,
  MarketingMediaLinkWrite,
  MarketingMediaRole,
  MarketingMediaVideoWrite,
  PerformablePropertyWrite,
} from 'shared/generated';
import DeleteIcon from 'shared/icons/DeleteIcon';
import { Validation } from 'shared/utilities/Validation';

function Image({ state }: { state: State<MarketingMediaImageWrite> }) {
  const scoped = useState(state);
  const { vendorId, serviceId } = useParams();

  return (
    <FormGroup>
      <FormHorizontal state={scoped.role} name="Role">
        <FormSelect
          state={scoped.role}
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
      <FormHorizontal state={scoped.file} name="Image">
        <FormImage state={scoped.file} meta={{ vendorId, serviceId }} />
      </FormHorizontal>
    </FormGroup>
  );
}

function Video({ state }: { state: State<MarketingMediaVideoWrite> }) {
  const scoped = useState(state);
  const { vendorId, serviceId } = useParams();

  return (
    <FormGroup>
      <FormHorizontal state={scoped.role} name="Role">
        <FormSelect
          state={scoped.role}
          options={[
            {
              label: 'Hero',
              value: MarketingMediaRole.Hero,
            },
            {
              label: 'Example',
              value: MarketingMediaRole.Example,
            },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal state={scoped.file} name="Image">
        <FormVideo state={scoped.file} meta={{ vendorId, serviceId }} />
      </FormHorizontal>
    </FormGroup>
  );
}

function MarketingLink({ state }: { state: State<MarketingMediaLinkWrite> }) {
  const scoped = useState(state);

  return (
    <FormGroup>
      <FormHorizontal state={scoped.label} name="Label">
        <FormText state={scoped.label} />
      </FormHorizontal>
      <FormHorizontal state={scoped.url} name="URL">
        <FormText state={scoped.url} />
      </FormHorizontal>
    </FormGroup>
  );
}

export default function VendorServicePropertyMarketing(state: State<PerformablePropertyWrite>): Tab {
  const scopedState = useState(state);

  return {
    key: 'pmarketing',
    name: 'Marketing',
    useElement: (
      <div className="space-y">
        <FormGroup>
          <FormHorizontal state={scopedState.marketing.name} name="Name">
            <FormText state={scopedState.marketing.name} />
          </FormHorizontal>
          <FormHorizontal state={scopedState.marketing.description} name="Description">
            <FormText state={scopedState.marketing.description} lines={8} />
          </FormHorizontal>
        </FormGroup>
        <ButtonGroup>
          <SlidebarOpenButton
            button="Add Link"
            onClick={() => {
              scopedState.marketing.links.merge([{ role: MarketingMediaRole.Example } as MarketingMediaLinkWrite]);
            }}
          >
            <SlidebarHeader title="Add Link" />
            <SlidebarContent>
              <MarketingLink state={scopedState.marketing.links[scopedState.marketing.links.length - 1]} />

              <SlidebarCloseButton>Finish</SlidebarCloseButton>
            </SlidebarContent>
          </SlidebarOpenButton>
          <SlidebarOpenButton
            button="Add Video"
            onClick={() => {
              scopedState.marketing.videos.merge([{ file: {} } as MarketingMediaVideoWrite]);
            }}
          >
            <SlidebarHeader title="Add Video" />
            <SlidebarContent>
              <Video state={scopedState.marketing.videos[scopedState.marketing.videos.length - 1]} />

              <SlidebarCloseButton>Finish</SlidebarCloseButton>
            </SlidebarContent>
          </SlidebarOpenButton>
          <SlidebarOpenButton
            button="Add Image"
            onClick={() => {
              scopedState.marketing.images.merge([{ file: {} } as MarketingMediaImageWrite]);
            }}
          >
            <SlidebarHeader title="Add Image" />
            <SlidebarContent>
              <Image state={scopedState.marketing.images[scopedState.marketing.images.length - 1]} />

              <SlidebarCloseButton>Finish</SlidebarCloseButton>
            </SlidebarContent>
          </SlidebarOpenButton>
        </ButtonGroup>
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell></TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scopedState.marketing.images.map((image, index) => (
                <TableRow key={`${index}`}>
                  <TableCell>
                    <Button style={ButtonStyle.DANGER} icon={<DeleteIcon />} onClick={() => image.set(none)} />
                  </TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>{image.file.name.get()}</TableCell>
                  <TableCell>
                    {image.file.s3.get() && <Lightbox src={image.file.s3.get()} sizes={[200, '33vw']} />}
                  </TableCell>
                </TableRow>
              ))}
              {scopedState.marketing.videos.map((video, index) => (
                <TableRow key={`${index}`}>
                  <TableCell>
                    <Button style={ButtonStyle.DANGER} icon={<DeleteIcon />} onClick={() => video.set(none)} />
                  </TableCell>
                  <TableCell>Video</TableCell>
                  <TableCell>{video.file.name.get()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
              {scopedState.marketing.links.map((link, index) => (
                <TableRow key={`${index}`}>
                  <TableCell>
                    <Button style={ButtonStyle.DANGER} icon={<DeleteIcon />} onClick={() => link.set(none)} />
                  </TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell>
                    <Link to={link.url.get()}>{link.label.get()}</Link>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    ),
    error: () => !Validation(scopedState.marketing).valid(false, ['images', 'videos', 'links']),
  };
}
