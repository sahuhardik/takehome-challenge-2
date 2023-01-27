import { none, State, useState } from '@hookstate/core';
import { MICROSITE_TYPE } from 'client/const';
import SlidebarOpenButton, { SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import FormCustomer from 'client/global/components/form/FormCustomer';
import FormPhone from 'client/global/components/form/FormPhone';
import FormUserRoles, { EditUser, UserConflict } from 'client/global/components/form/FormUserRoles';
import Link from 'client/global/components/tailwind/Link';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import Toolbar from 'client/global/components/tailwind/Toolbar';
import VendorCustomerCcs from 'client/portal/vendor/customers/VendorCustomerCcs';
import { VendorCustomerNotify } from 'client/portal/vendor/customers/VendorCustomerNotify';
import VendorCustomerProvider from 'client/portal/vendor/customers/VendorCustomerProvider';
import VendorCustomerRules from 'client/portal/vendor/customers/VendorCustomerRules';
import VendorCustomerTodos from 'client/portal/vendor/customers/VendorCustomerTodos';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import FieldsConfigureForm from 'shared/components/fields/FieldsConfigureForm';
import FormAddress from 'shared/components/form/FormAddress/FormAddress';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormNumber from 'shared/components/form/FormNumber';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import ConfirmModal from 'shared/components/tailwind/ConfirmModal';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  BuyerWrite,
  BuyerWriteUser,
  FieldRole,
  InvoiceInterval,
  MemberType,
  RoleType,
  UserContactsByIdsDocument,
  UserContactsByIdsQuery,
  VendorBuyerDeleteDocument,
  VendorCustomerFormDocument,
  VendorCustomerGetQuery,
  VendorMemberGetDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import WarningIcon from 'shared/icons/WarningIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

type Customer = VendorCustomerGetQuery['buyer'];

type SameEmailUser = UserContactsByIdsQuery['userByIds'][number];

interface VendorCustomerFormProps {
  state: State<BuyerWrite>;
  mutation: (data: BuyerWrite, sendEmail: boolean) => Promise<void>;
  customer?: Customer;
  title: string;
}

const Buyer = ({ state }: { state: State<string> }) => {
  const scoped = useState(state);

  const { member } = useQueryHook(VendorMemberGetDocument, { memberId: scoped.get() });

  return (
    <Link
      icon={<EditIcon />}
      onClick={() => {
        scoped.set(none);
      }}
    >
      <span className="font-medium text-gray-900">{member.company}</span>
    </Link>
  );
};

function UserConflictDialog({
  users,
  conflict: { update, previous },
  onResolve,
}: {
  users: State<BuyerWriteUser[]>;
  conflict: UserConflict;
  onResolve: () => void;
}) {
  const previousUser = users.find((user) => user.userId.get() == previous.id);

  return (
    <ConfirmModal
      icon={<WarningIcon />}
      title={'Conflict'}
      description={`User email '${update.email}' already exist!`}
      confirmButton={
        <>
          <Button
            onClick={() => {
              previousUser.userId.set(update.id);
              onResolve();
            }}
          >
            Swap
          </Button>

          <Button
            onClick={() => {
              users.merge([{ userId: update.id, roleIds: previousUser.roleIds.get() }]);
              onResolve();
            }}
          >
            Add New
          </Button>
        </>
      }
      onCancel={onResolve}
    />
  );
}

function SameEmailWarning({
  vendorId,
  memberId,
  customerEmail,
  userIds,
  objectRef,
}: {
  vendorId: string;
  memberId: string;
  customerEmail: string;
  userIds: string[];
  objectRef: React.MutableRefObject<{ checkUserHavingSameEmail: () => void }>;
}) {
  const userHavingSameEmail = useState<SameEmailUser>(null);
  const getUserContactsByIds = useQueryPromise(UserContactsByIdsDocument);
  const checkUserHavingSameEmail = async () => {
    const { userByIds } = await getUserContactsByIds({ ids: userIds });
    const foundedSameEmail = userByIds.find((user) => user.email === customerEmail);
    userHavingSameEmail.set(foundedSameEmail);
  };

  React.useEffect(() => {
    checkUserHavingSameEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  objectRef.current = {
    checkUserHavingSameEmail,
  };

  if (userHavingSameEmail.get() && userHavingSameEmail.email.get() !== customerEmail) {
    return (
      <Message
        className="mb-5"
        type={MessageType.WARNING}
        title="The original email address is also associated with an attached user and was not changed. If you wish to send notifications to the new email address, make sure to edit the user below and update their email as well."
        round
      >
        <SlidebarOpenLink text={userHavingSameEmail.name.get()} icon={<EditIcon />}>
          <EditUser
            userId={userHavingSameEmail.id.get()}
            ownerId={vendorId}
            memberId={memberId}
            checkMemberIds={[vendorId]}
            onUpdate={checkUserHavingSameEmail}
          />
        </SlidebarOpenLink>
      </Message>
    );
  }
  return null;
}

function CustomerGeneral({ state, customer }: { customer: Customer; state: State<BuyerWrite> }) {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorCustomerFormDocument, { vendorId }, 'cache-and-network');
  const scopedState = useState(state);
  const conflict = useState<UserConflict>(undefined);
  const sameEmailWarningRef = React.useRef<{ checkUserHavingSameEmail: () => void }>();

  const isOrg = state.type.get() === MemberType.Organization;

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.company} name="Name">
        <FormText state={scopedState.company} />
      </FormHorizontal>
      {isOrg && (
        <FormHorizontal state={scopedState.buyerGroupTypeId} name="Organization Type">
          <FormSelect
            state={scopedState.buyerGroupTypeId}
            options={vendor.buyerGroupTypes.map((t) => ({ label: t.name, value: t.id }))}
          />
        </FormHorizontal>
      )}
      <FormHorizontal
        state={scopedState.email}
        name="Email"
        description="A public email address used by the customer for marketing purposes. This email will NOT be used for sending messages or notifications (that is reserved for the users attached to this account)."
      >
        <SameEmailWarning
          memberId={customer?.member.id}
          customerEmail={scopedState.email.get()}
          vendorId={vendorId}
          userIds={state.users.get().map((user) => user.userId)}
          objectRef={sameEmailWarningRef}
        />
        <FormText type="email" state={scopedState.email} />
      </FormHorizontal>
      <FormHorizontal
        state={scopedState.phone}
        name="Phone"
        description="A public phone number used by the customer for marketing purposes. This number will NOT be used for sending messages or notifications (that is reserved for the users attached to this account)."
      >
        <FormPhone state={scopedState.phone} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.micrositeType} lang="micrositeType">
        <FormSelect state={scopedState.micrositeType} options={MICROSITE_TYPE} />
      </FormHorizontal>
      <FieldsConfigureForm
        context={{}}
        fields={vendor.fields.filter((f) => f.role === FieldRole.Buyer)}
        state={state.properties}
      />
      <FormHorizontal state={scopedState.address} name="Address">
        <FormAddress state={scopedState.address} coords={vendor.address} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.users} name="Users">
        <FormUserRoles
          state={scopedState.users}
          roles={vendor.roles.filter((r) => r.type === RoleType.Buyer)}
          defaultRoles={vendor.defaultRoles.map((r) => ({ ...r, default: true }))}
          timezone={vendor.timezone}
          ownerId={vendorId}
          memberId={customer?.member.id}
          checkMemberIds={[vendorId]}
          handleConflict={(user) => conflict.set(user)}
          onUserUpdate={sameEmailWarningRef.current?.checkUserHavingSameEmail}
        />

        {conflict.get() &&
          UserConflictDialog({
            users: scopedState.users,
            conflict: conflict.get(),
            onResolve: () => conflict.set(undefined),
          })}
      </FormHorizontal>
      <FormHorizontal state={scopedState.parentId} name={isOrg ? 'Parent Organization' : 'Member Of'}>
        {scopedState.parentId.get() ? (
          <Buyer state={scopedState.parentId} />
        ) : (
          <FormCustomer state={scopedState.parentId} member group />
        )}
      </FormHorizontal>
      <CommonForm state={scopedState} />
    </FormGroup>
  );
}

function CommonForm({ state }: { state: State<BuyerWrite> }) {
  const scopedState = useState(state);

  return (
    <>
      <FormHorizontal
        state={scopedState.postPay}
        name="Pay Later"
        description="When enabled, the customer is not charged when the order is confirmed."
      >
        <FormSwitch state={scopedState.postPay} />
      </FormHorizontal>
      {scopedState.postPay.get() && (
        <FormHorizontal
          state={scopedState.netTerms}
          name="NET Terms"
          description="If provided, will send the customer an invoice when the order is completed, otherwise will charge the card on file at order completion."
        >
          <FormNumber state={scopedState.netTerms} />
        </FormHorizontal>
      )}
      {scopedState.netTerms.get() > 0 && (
        <FormHorizontal
          state={scopedState.interval}
          name="Invoice Interval"
          description="If set, all orders will be aggregated into a single invoice on a recurring basis."
        >
          <FormSelect
            state={scopedState.interval}
            options={[
              { value: InvoiceInterval.MONTHLY, label: 'Monthly' },
              { value: InvoiceInterval.WEEKLY, label: 'Weekly' },
              { value: InvoiceInterval.BI_MONTHLY, label: 'Bi-Monthly' },
              { value: InvoiceInterval.BI_WEEKLY, label: 'Bi-Weekly' },
            ]}
          />
        </FormHorizontal>
      )}
    </>
  );
}

function PersonForm({
  state,
  customer,
  sendEmailState,
}: {
  customer?: Customer;
  state: State<BuyerWrite>;
  sendEmailState: State<boolean>;
}) {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorCustomerFormDocument, { vendorId }, 'cache-and-network');
  const scopedState = useState(state);
  ValidationAttach(sendEmailState);

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.person.first} name="First Name">
        <FormText state={scopedState.person.first} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.person.last} name="Last Name">
        <FormText state={scopedState.person.last} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.person.email} name="Email">
        <FormText type="email" state={scopedState.person.email} />
      </FormHorizontal>
      <FormHorizontal
        state={sendEmailState}
        name="Send E-Mail"
        description="If selected, an e-mail will be sent to the user with a generated password"
      >
        <FormSwitch state={sendEmailState} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.person.phone} name="Phone">
        <FormPhone state={scopedState.person.phone} />
      </FormHorizontal>
      <FieldsConfigureForm
        context={{}}
        fields={vendor.fields.filter((f) => f.role === FieldRole.Buyer)}
        state={state.properties}
      />
      <FormHorizontal state={scopedState.address} name="Address">
        <FormAddress state={scopedState.address} coords={vendor.address} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.micrositeType} lang="micrositeType">
        <FormSelect state={scopedState.micrositeType} options={MICROSITE_TYPE} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.users} name="Additional Users">
        <FormUserRoles
          state={scopedState.users}
          memberId={customer?.member.id}
          ownerId={vendorId}
          checkMemberIds={[vendorId]}
          excludeEmails={scopedState.person.email.get() ? [scopedState.person.email.get()] : []}
          excludeEmailsMessage="No need to add this user, it gets created automatically"
          skipDefault
          roles={vendor.roles.filter((r) => r.type === RoleType.Buyer)}
          defaultRoles={vendor.defaultRoles.map((r) => ({ ...r, default: true }))}
          timezone={vendor.timezone}
        />
      </FormHorizontal>
      <FormHorizontal state={scopedState.parentId} name="Member Of">
        {scopedState.parentId.get() ? (
          <Buyer state={scopedState.parentId} />
        ) : (
          <FormCustomer state={scopedState.parentId} member placeholder="search by organization name" group />
        )}
      </FormHorizontal>
      <CommonForm state={scopedState} />
    </FormGroup>
  );
}

function OrganizationForm({ state, customer }: { customer?: Customer; state: State<BuyerWrite> }) {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorCustomerFormDocument, { vendorId }, 'cache-and-network');
  const scopedState = useState(state);

  const navigate = useNavigate();

  if (!vendor.buyerGroupTypes?.length) {
    return (
      <Message
        type={MessageType.WARNING}
        actions={[
          {
            label: 'Groups',
            onClick: async () => {
              navigate(`/ui/vendor/${vendorId}/settings/groups`);
            },
          },
        ]}
      >
        You have to create a customer group type first, otherwise organization type is not selectable
      </Message>
    );
  }

  return (
    <FormGroup>
      <FormHorizontal state={scopedState.company} name="Name">
        <FormText state={scopedState.company} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.buyerGroupTypeId} name="Organization Type">
        <FormSelect
          state={scopedState.buyerGroupTypeId}
          options={vendor.buyerGroupTypes.map((t) => ({ label: t.name, value: t.id }))}
        />
      </FormHorizontal>
      <FormHorizontal
        state={scopedState.email}
        name="Email"
        description="A public email address used by the organization, not an individual. This email will NOT be used for sending messages or notifications (that is reserved for the users attached to this account)."
      >
        <FormText type="email" state={scopedState.email} />
      </FormHorizontal>
      <FormHorizontal
        state={scopedState.phone}
        name="Phone"
        description="A public phone number used by the organization, not an individual. This number will NOT be used for sending messages or notifications (that is reserved for the users attached to this account)."
      >
        <FormPhone state={scopedState.phone} />
      </FormHorizontal>
      <FieldsConfigureForm
        context={{}}
        fields={vendor.fields.filter((f) => f.role === FieldRole.Buyer)}
        state={state.properties}
      />
      <FormHorizontal state={scopedState.address} name="Address">
        <FormAddress state={scopedState.address} coords={vendor.address} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.micrositeType} lang="micrositeType">
        <FormSelect state={scopedState.micrositeType} options={MICROSITE_TYPE} />
      </FormHorizontal>
      <FormHorizontal state={scopedState.users} name="Users">
        <FormUserRoles
          state={scopedState.users}
          memberId={customer?.member.id}
          ownerId={vendorId}
          checkMemberIds={[vendorId]}
          roles={vendor.roles.filter((r) => r.type === RoleType.Buyer)}
          defaultRoles={vendor.defaultRoles.map((r) => ({ ...r, default: true }))}
          timezone={vendor.timezone}
        />
      </FormHorizontal>
      <FormHorizontal state={scopedState.parentId} name="Parent Organization">
        {scopedState.parentId.get() ? (
          <Buyer state={scopedState.parentId} />
        ) : (
          <FormCustomer state={scopedState.parentId} member placeholder="search by organization name" group />
        )}
      </FormHorizontal>
      <CommonForm state={scopedState} />
    </FormGroup>
  );
}

export default function VendorCustomerForm({ title, state, customer, mutation }: VendorCustomerFormProps) {
  const scope = useState(state);
  const sendEmailState = useState(false);
  const { vendorId } = useParams();

  const tabs: Tab[] = [
    {
      key: 'general',
      name: 'General',
      useElement: customer?.id ? (
        <CustomerGeneral state={state} customer={customer} />
      ) : scope.type.get() === MemberType.Organization ? (
        <OrganizationForm state={state} customer={customer} />
      ) : (
        <PersonForm state={state} customer={customer} sendEmailState={sendEmailState} />
      ),
    },
  ];

  if (customer?.id) {
    tabs.push({
      key: 'providers',
      name: 'Providers',
      useElement: <VendorCustomerProvider state={state} />,
    });
    tabs.push({
      key: 'rules',
      name: 'Rules',
      useElement: <VendorCustomerRules customer={customer} />,
    });
    tabs.push({
      key: 'todos',
      name: 'Todos',
      useElement: <VendorCustomerTodos buyerRelId={customer.id} />,
    });
    tabs.push({
      key: 'ccs',
      name: 'Contacts',
      useElement: <VendorCustomerCcs buyerRelId={customer.id} />,
    });
  }

  const navigate = useNavigate();
  const deleteBuyer = useMutationPromise(VendorBuyerDeleteDocument);

  const actions = [
    <PromiseButton
      key="save"
      onClick={async () => {
        await mutation(state.get(), sendEmailState.get());

        if (!customer?.id) {
          navigate(`/ui/vendor/${vendorId}/customers`);
        }
      }}
      disabled={!Validation(state).valid(true)}
    >
      Save
    </PromiseButton>,
  ];

  if (customer?.id) {
    actions.push(
      <SlidebarOpenButton key="notify" style={ButtonStyle.SECONDARY} button="Notify">
        <VendorCustomerNotify buyerRelId={customer?.id} />
      </SlidebarOpenButton>
    );

    const buttonProps = {
      key: 'delete',
      style: ButtonStyle.DANGER,
      icon: <DeleteIcon />,
      children: 'Delete',
      onClick: async () => {
        await deleteBuyer({ vendorId, buyerId: customer.id });
        navigate(`/ui/vendor/${vendorId}/customers?excludeId=${customer.id}`);
      },
    };

    actions.unshift(
      customer.hasLedgers ? (
        <ConfirmationButton
          {...buttonProps}
          title="Are you sure you want to delete this customer?"
          description="This customer has orders where work has already been completed"
          confirmText="Delete Customer"
        />
      ) : (
        <PromiseButton {...buttonProps} />
      )
    );
  }
  return (
    <Toolbar title={title} actions={actions}>
      <Tabs tabs={tabs} />
    </Toolbar>
  );
}
