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
import SlidebarRouter from 'client/global/layout/slidebar/SlidebarRouter';
import useVendorRuleEdit from 'client/portal/vendor/components/rule/useVendorRuleState';
import VendorRuleForm from 'client/portal/vendor/components/rule/VendorRuleForm';
import * as React from 'react';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { VendorRuleAllDocument, VendorRuleArchiveDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';

function List() {
  const { vendorId } = useParams();

  const data = useQueryHook(VendorRuleAllDocument, { vendorId }, 'cache-and-network');
  const archive = useMutationPromise(VendorRuleArchiveDocument);
  const list = useQueryPromise(VendorRuleAllDocument);

  const refresh = useCallback(async () => {
    await list({ vendorId });
  }, [list, vendorId]);

  return (
    <Center padding>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Rule Name</TableHeadCell>
            <TableHeadCell />
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link to="./create" style={LinkStyle.BOLD} icon={<AddIcon />}>
                Create New Rule
              </Link>
            </TableCell>
          </TableRow>
          {data.vendor.rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>
                <Link to={`./${rule.id}`} icon={<EditIcon />}>
                  {rule.name}
                </Link>
              </TableCell>
              <TableCell>
                <ConfirmationButton
                  title="Archive"
                  confirmText="Archive"
                  icon={<DeleteIcon />}
                  description="Are you sure you want to archive this rule?"
                  onClick={async () => {
                    await archive({ ruleId: rule.id });
                    await refresh();
                  }}
                  style={ButtonStyle.TERTIARY}
                >
                  Archive
                </ConfirmationButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}

function Edit() {
  const { ruleId } = useParams();

  const data = useVendorRuleEdit(ruleId);

  return <VendorRuleForm data={data} />;
}

export default function VendorSettingsRuleRouter() {
  return <SlidebarRouter root={<List />} paths={{ create: <VendorRuleForm />, ':ruleId': <Edit /> }} />;
}
