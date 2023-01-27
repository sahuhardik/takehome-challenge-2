import { useState } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import Sortable from 'client/global/components/Sortable';
import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import ActionBar from 'client/global/layout/ActionBar';
import SlidebarRouter from 'client/global/layout/slidebar/SlidebarRouter';
import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import ConfirmModal from 'shared/components/tailwind/ConfirmModal';
import {
  PerformableOrderWrite,
  VendorServiceArchiveDocument,
  VendorServiceCreateDocument,
  VendorServiceDeleteDocument,
  VendorServicesDocument,
  VendorServicesQuery,
  VendorUpdatePerformablesDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DangerIcon from 'shared/icons/DangerIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import MoveIcon from 'shared/icons/MoveIcon';
import { ValidationAttach } from 'shared/utilities/Validation';
import VendorServiceView from './VendorServiceView';

function VendorServiceCreate() {
  const vendorId = useCurrentVendorId();
  const create = useMutationPromise(VendorServiceCreateDocument);
  const newServiceName = useState(null as string);

  ValidationAttach(newServiceName, (validator) => validator.required());

  return (
    <>
      <ActionBar
        state={newServiceName}
        onClick={async () => {
          const resp = await create({
            vendorId,
            data: {
              name: newServiceName.get(),
              cartEnable: false,
              variants: [],
              steps: [],
              properties: [],
              dependencies: [],
              notifications: [],
              providers: [],
            },
          });

          return `../${resp.createService.id}`;
        }}
      />
      <Center padding>
        <FormGroup>
          <FormHorizontal state={newServiceName} name="Name">
            <FormText state={newServiceName} />
          </FormHorizontal>
        </FormGroup>
      </Center>
    </>
  );
}
function VendorServiceList() {
  const { vendorId } = useParams();
  const archiveConfirm = useState<string | null>(null);

  const query = useQueryHook(VendorServicesDocument, { vendorId });
  const archiveService = useMutationPromise(VendorServiceArchiveDocument);
  const deleteService = useMutationPromise(VendorServiceDeleteDocument);
  const refreshList = useQueryPromise(VendorServicesDocument);

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  });
  const update = useMutationPromise(VendorUpdatePerformablesDocument);
  const getServices = useCallback(
    (query: VendorServicesQuery) =>
      query.vendor.services
        .sort((a, b) => (a.sortOrder > b.sortOrder ? 1 : -1))
        .map((service, index) => ({ ...service, order: index + 1 })),
    []
  );
  const servicesInOrder = getServices(query);
  const services = useState(servicesInOrder);
  const updateServices = async () => {
    const sortedServices = services.map<PerformableOrderWrite>(({ id, order }) => ({
      performableId: id.get(),
      order: order.get(),
    }));

    await update({ performables: sortedServices });

    // TODO: update VendorUpdateProviders to return list of providers so that cache refresh happens automatically
    await refreshList({ vendorId });
  };

  return (
    <Center padding>
      {!!archiveConfirm.value && (
        <ConfirmModal
          icon={<DangerIcon />}
          title="Deletion failed"
          description="Do you want to archive this service?"
          cancelText="Cancel"
          confirmButton={
            <PromiseButton
              onClick={async (e) => {
                e.preventDefault();
                await archiveService({ serviceId: archiveConfirm.value });
                const response = await refreshList({ vendorId });
                if (mounted.current) {
                  services.set(getServices(response));
                  archiveConfirm.set(null);
                }
              }}
            >
              Archive
            </PromiseButton>
          }
          onCancel={() => archiveConfirm.set(null)}
        />
      )}
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Service</TableHeadCell>
            <TableHeadCell></TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link to="create" style={LinkStyle.BOLD} icon={<AddIcon />}>
                Add Service
              </Link>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
          {services.map((p, index) => (
            <TableRow key={p.id.get()}>
              <TableCell>
                <Sortable index={index} state={services} key={index} onDrop={updateServices}>
                  <div className="flex">
                    <div className="w-4 h-4 mr-2 cursor-move">
                      <MoveIcon />
                    </div>
                    <Link icon={<EditIcon />} to={`./${p.id.get()}`}>
                      {p.internalName.get() || p.name.get()}
                    </Link>
                  </div>
                </Sortable>
              </TableCell>
              <TableCell>
                <PromiseButton
                  style={ButtonStyle.DANGER}
                  icon={<DeleteIcon />}
                  onClick={async () => {
                    const serviceId = p.id.get();
                    try {
                      await deleteService({ serviceId });
                      const response = await refreshList({ vendorId });
                      if (mounted.current) {
                        services.set(getServices(response));
                      }
                    } catch (e) {
                      if (mounted.current) {
                        archiveConfirm.set(serviceId);
                      }
                    }
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}

export default function VendorService() {
  useRegisterBreadcrumb({
    name: 'Services',
    link: '/settings/services',
  });

  return (
    <SlidebarRouter
      root={<VendorServiceList />}
      paths={{ create: <VendorServiceCreate />, ':serviceId': <VendorServiceView /> }}
    />
  );
}
