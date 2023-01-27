import { VendorOrderAccountingLineFragment } from 'shared/generated';

export default interface ProviderCombinedLine {
  id: string;
  revenue?: VendorOrderAccountingLineFragment;
  fieldId?: string;
  fieldName?: string;
  fieldValue?: string;
}
