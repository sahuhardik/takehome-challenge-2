import { State, useState } from '@hookstate/core';
import { ButtonGroup } from 'client/global/components/button/ButtonGroup';
import MapAppointment from 'client/global/components/map/MapAppointment';
import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
import Modal from 'client/global/components/tailwind/Modal';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { ModelDiff, ModelDiffData, VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import dayjs from 'dayjs';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { ScheduleUpdate, VendorProvidersDocument, VendorScheduleUpdateDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import ChevronLeft from 'shared/icons/ChevronLeft';
import ChevronRight from 'shared/icons/ChevronRight';
import { ValidationAttach } from 'shared/utilities/Validation';

function VendorScheduleReviewInfo({ data, compare }: { data: ModelDiffData; compare?: ModelDiffData }) {
  const { vendorId } = useParams();

  const query = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-and-network');

  const timeBg = compare && compare.scheduled && !dayjs(data.scheduled).isSame(compare.scheduled) ? 'bg-highlight' : '';
  const providerBg = compare && data.providerId !== compare.providerId ? 'bg-highlight' : '';
  const lockedBg = compare && data.locked !== compare.locked ? 'bg-highlight' : '';
  const jobsBg =
    compare && data.jobs.map((j) => j.id).join('') !== compare.jobs.map((j) => j.id).join('') ? 'bg-highlight' : '';

  return (
    <>
      <DescriptionListItem name="Time">
        <div className={timeBg}>{dayjs(data.scheduled).format('MM/DD/YYYY h:mm A')}</div>
      </DescriptionListItem>
      <DescriptionListItem name="Provider">
        <div className={providerBg}>
          {query.vendor.providers.find((p) => p.member.id === data.providerId).member.company}
        </div>
      </DescriptionListItem>
      <DescriptionListItem name="Locked">
        <div className={lockedBg}>{data.locked ? 'Yes' : 'No'}</div>
      </DescriptionListItem>
      <DescriptionListItem name="Jobs">
        <div className={jobsBg}>{data.jobs.map((j) => j.performable.shortName).join(' + ')}</div>
      </DescriptionListItem>
    </>
  );
}

function DiffForm({ model, diff }: { diff: ModelDiff; model: VendorScheduleModel }) {
  const group = diff.after?.group || diff.before?.group;

  const notify = model.useNotify(group);

  return (
    <div className="flex p bg-accent">
      <div className="flex-1">
        <FormHorizontal name="Notify Buyer">
          <FormSwitch state={notify.notifyBuyer} />
        </FormHorizontal>
      </div>
      <div className="flex-1">
        <FormHorizontal name="Notify Provider">
          <FormSwitch state={notify.notifyAssignee} />
        </FormHorizontal>
      </div>
    </div>
  );
}

function Diff({ model, index, diffs }: { diffs: ModelDiff[]; model: VendorScheduleModel; index: State<number> }) {
  const scopedIndex = useState(index);
  const diff = diffs[scopedIndex.get()];

  if (!diff) {
    return <></>;
  }

  return (
    <div className="bg-content round overflow-hidden shadow">
      <MapAppointment address={diff && diff.order.address} height={100} />
      <div className="flex justify-between items-center p-2">
        <div className="text-left">
          <div
            className={`w-10 h-10 ${scopedIndex.get() === 0 ? 'opacity-30' : 'cursor-pointer'}`}
            onClick={() => {
              if (scopedIndex.get() > 0) {
                scopedIndex.set((i) => i - 1);
              }
            }}
          >
            <ChevronLeft />
          </div>
        </div>
        <div>
          {scopedIndex.get() + 1} / {diffs.length}
        </div>
        <div className="text-right">
          <div
            className={`w-10 h-10 ${scopedIndex.get() === diffs.length - 1 ? ' opacity-30' : ' cursor-pointer'}`}
            onClick={() => {
              if (scopedIndex.get() < diffs.length - 1) {
                scopedIndex.set((i) => i + 1);
              }
            }}
          >
            <ChevronRight />
          </div>
        </div>
      </div>
      <div className="flex p bg-accent space-x">
        <div className="flex-1">
          <div className="text-lg pb-2 font-semibold text-gray-500">Before</div>

          <div className="bg-content round shadow">
            {diff.before ? <VendorScheduleReviewInfo data={diff.before} /> : <div className="p">Unscheduled</div>}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-lg pb-2 font-semibold text-gray-500">After</div>

          <div className="bg-content round shadow">
            {diff.after ? (
              <VendorScheduleReviewInfo data={diff.after} compare={diff.before} />
            ) : (
              <div className="p">Unscheduled</div>
            )}
          </div>
        </div>
      </div>
      <DiffForm diff={diff} model={model} />
    </div>
  );
}

export default function VendorScheduleReview({ model }: { model: VendorScheduleModel }) {
  const { vendorId } = useParams();

  const state = useState({
    open: false,
    index: 0,
  });

  ValidationAttach(state);

  const diffs = model.useDiff();

  const handleClose = () => {
    state.open.set(false);
  };

  const save = useMutationPromise(VendorScheduleUpdateDocument);

  const conflicts = model.useConflicts();

  if (conflicts.outdated) {
    return <></>;
  }

  const handleSave = async () => {
    const updates: ScheduleUpdate[] = [];

    for (const d of diffs) {
      if (!!d.before && !d.after) {
        for (const job of d.before.jobs) {
          updates.push({
            jobId: job.id,
            cancel: true,
            notifyBuyer: d.notifyBuyer,
            notifyProvider: d.notifyAssignee,
          });
        }

        continue;
      }

      for (const job of d.after.jobs) {
        updates.push({
          notifyBuyer: d.notifyBuyer,
          notifyProvider: d.notifyAssignee,
          providerId: d.after.providerId,
          locked: d.after.locked,
          start: new Date(d.after.scheduled).toISOString(),
          group: d.after.group,
          jobId: job.id,
        });
      }
    }

    await save({ vendorId, updates, version: conflicts.version });
    conflicts.init(conflicts.version + 1);

    await model.reset();

    handleClose();
  };

  return (
    <>
      <div className="fixed right-4 bottom-9 z-20">
        {diffs.length > 0 && (
          <Button
            onClick={() => {
              state.merge({ open: true, index: 0 });
            }}
          >
            Review Changes
          </Button>
        )}
      </div>
      <Modal show={state.open} onClose={handleClose}>
        <SpinnerLoader>
          <div className="max-w-screen-lg w-full flex flex-col">
            <Diff model={model} index={state.index} diffs={diffs} />
            <div className="pt text-center">
              <ButtonGroup>
                <Button onClick={handleClose} style={ButtonStyle.QUIET}>
                  Cancel
                </Button>
                <PromiseButton onClick={handleSave}>Save changes</PromiseButton>
              </ButtonGroup>
            </div>
          </div>
        </SpinnerLoader>
      </Modal>
    </>
  );
}
