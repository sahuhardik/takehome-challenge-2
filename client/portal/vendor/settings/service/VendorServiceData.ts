import { State } from '@hookstate/core';
import { PropertyPricing, ServiceWrite, VendorServiceQuery } from 'shared/generated';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export type VendorServiceData = VendorServiceQuery['service'];
export type VendorServiceNotification = VendorServiceData['notifications'][0];

export default class VendorServiceValidator {
  constructor(private state: State<ServiceWrite>) {
    ValidationAttach(state, (validator) => {
      validator.name.required();
      validator.shortName.required();
      validator.assignmentType.required();

      validator.marketing.images.role.required();
      validator.marketing.images.file.s3.required();

      validator.marketing.videos.role.required();
      validator.marketing.videos.file.s3.required();

      validator.marketing.links.role.required();
      validator.marketing.links.label.required();
      validator.marketing.links.url.required();

      validator.properties.name.required();
      validator.properties.pricingType.required();
      validator.properties.visibility.required();

      validator.properties.conditions.logic.required();
      validator.properties.conditions.referenceId.required();
      validator.properties.conditions.comparator.required();
      validator.properties.fieldType.required();
      validator.properties.role.required();
      validator.properties.lifecycle.required();
      validator.properties.values.name.required();

      validator.properties
        .when((property) => {
          if (property.pricingType.get() === PropertyPricing.Matrix) {
            return false;
          }

          const hasExpense = Math.abs(parseFloat(property.expense.get())) > 0;
          const hasRevenue = Math.abs(parseFloat(property.revenue.get())) > 0;
          const nestedPricing = property.values.some(
            (v) => parseFloat(v.revenue.get()) > 0 || parseFloat(v.expense.get()) > 0
          );

          return hasExpense || hasRevenue || nestedPricing;
        })
        .revenueType.required();

      validator.properties.tiers.from.validate((x) => x && x > 1);
    });
  }

  valid() {
    return Validation(this.state).valid(true);
  }

  general() {
    return true; //Validation(this.state).valid(['name', 'shortName', 'internalName', 'revenue', 'expense']);
  }

  scheduling() {
    return true; //Validation(this.state).valid(['assignmentType', 'onsite', 'acknowledgeAssignment', 'notifyBuyerOnScheduled']);
  }

  properties() {
    return true; //Validation(this.state.properties).valid();
  }

  advanced() {
    return true; //Validation(this.state.apiName).valid();
  }
}
