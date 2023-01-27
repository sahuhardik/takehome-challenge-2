import { VendorOrderAccountingLineFragment } from 'shared/generated';

export default interface CombinedLine {
  id: string;
  revenue?: VendorOrderAccountingLineFragment;
  expense?: VendorOrderAccountingLineFragment;
  fieldId?: string;
  fieldName?: string;
  fieldValue?: string;
}
