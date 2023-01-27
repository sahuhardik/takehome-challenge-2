import { Query } from '@cubejs-client/core';

export enum ReportDimensions {
  SERVICE_NAME = 'Service.name',
  CUSTOMER_UNIQUE_SERVICES = 'Customer.uniqueServices',
  FIELD_NAME = 'JobNumberField.fieldName',
  CUSTOMER_NAME = 'Customer.name',
  INVOICE_PAID = 'Invoice.paid',
  ORDER_CITY = 'Order.city',
  ORDER_POSTAL = 'Order.postal',
}

export enum ReportMeasures {
  ORDER_JOBS = 'Order.jobs',
  ORDER_AVERAGE_JOBS = 'Order.avgJobs',
  ORDER_REVENUE = 'Order.revenue',
  ORDER_COUNT = 'Order.count',
  ORDER_CUSTOMERS = 'Order.customers',
  ORDER_AVERAGE_REVENUE = 'Order.avgRevenue',
  CUSTOMER_ORDERS = 'Customer.orders',
  CUSTOMER_COUNT = 'Customer.count',
  CUSTOMER_REVENUE = 'Customer.revenue',
  FIELD_NUMBER = 'JobNumberField.amount',
  FIELD_JOBS = 'JobNumberField.jobs',
  JOB_REVENUE = 'Job.revenue',
  JOB_AVERAGE_REVENUE = 'Job.avgRevenue',
  JOB_EXPENSE = 'Job.expense',
  JOB_COUNT = 'Job.count',
  PAYMENT_AMOUNT = 'Payment.amount',
  PAYMENT_COUNT = 'Payment.count',
  INVOICE_COUNT = 'Invoice.count',
  INVOICE_AMOUNT = 'Invoice.amount',
}

export enum ReportTime {
  ORDER_CREATED = 'Order.created',
  JOB_ACCRUAL = 'Job.accrual',
  JOB_CREATED = 'Job.created',
  PAYMENT_CREATED = 'Payment.created',
  INVOICE_CREATED = 'Invoice.created',
  CUSTOMER_FIRST_ORDER = 'Customer.firstOrder',
}

export enum PremadeVendorReport {
  SERVICE_REVENUE,
  NEW_CUSTOMERS,
  JOB_TREND,
  ORDER_TREND,
  PAID_INVOICES,
  AVERAGE_ORDER_AMOUNT,
  TOP_CUSTOMERS,
  NUMERIC_JOB_FIELDS,
  CUSTOMER_LTV,
  CUSTOMER_SERVICE_DIVERSITY,
  AVERAGE_JOBS_PER_ORDER,
  SERVICE_PENETRATION,
}

export const measureMapping: Record<ReportMeasures, { dimensions: ReportDimensions[]; times: ReportTime[] }> = {
  [ReportMeasures.CUSTOMER_COUNT]: {
    times: [ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.FIELD_NAME, ReportDimensions.CUSTOMER_UNIQUE_SERVICES],
  },
  [ReportMeasures.CUSTOMER_ORDERS]: {
    times: [ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.CUSTOMER_UNIQUE_SERVICES, ReportDimensions.CUSTOMER_NAME],
  },
  [ReportMeasures.CUSTOMER_REVENUE]: {
    times: [ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.CUSTOMER_UNIQUE_SERVICES, ReportDimensions.CUSTOMER_NAME],
  },
  [ReportMeasures.FIELD_JOBS]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
    dimensions: [ReportDimensions.FIELD_NAME],
  },
  [ReportMeasures.FIELD_NUMBER]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
    dimensions: [ReportDimensions.FIELD_NAME],
  },
  [ReportMeasures.INVOICE_COUNT]: {
    times: [ReportTime.INVOICE_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.INVOICE_PAID, ReportDimensions.CUSTOMER_NAME],
  },
  [ReportMeasures.INVOICE_AMOUNT]: {
    times: [ReportTime.INVOICE_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.INVOICE_PAID, ReportDimensions.CUSTOMER_NAME],
  },
  [ReportMeasures.PAYMENT_COUNT]: {
    times: [ReportTime.PAYMENT_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.CUSTOMER_NAME],
  },
  [ReportMeasures.PAYMENT_AMOUNT]: {
    times: [ReportTime.PAYMENT_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.CUSTOMER_NAME],
  },
  [ReportMeasures.ORDER_JOBS]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.ORDER_CITY, ReportDimensions.ORDER_POSTAL],
  },
  [ReportMeasures.ORDER_REVENUE]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.FIELD_NAME, ReportDimensions.ORDER_CITY, ReportDimensions.ORDER_POSTAL],
  },
  [ReportMeasures.ORDER_CUSTOMERS]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.ORDER_POSTAL, ReportDimensions.ORDER_CITY],
  },
  [ReportMeasures.ORDER_COUNT]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.FIELD_NAME, ReportDimensions.ORDER_CITY, ReportDimensions.ORDER_POSTAL],
  },
  [ReportMeasures.ORDER_AVERAGE_REVENUE]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.CUSTOMER_NAME, ReportDimensions.ORDER_CITY, ReportDimensions.ORDER_POSTAL],
  },
  [ReportMeasures.ORDER_AVERAGE_JOBS]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
    dimensions: [ReportDimensions.CUSTOMER_NAME, ReportDimensions.ORDER_CITY, ReportDimensions.ORDER_POSTAL],
  },
  [ReportMeasures.JOB_AVERAGE_REVENUE]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
    dimensions: [ReportDimensions.SERVICE_NAME],
  },
  [ReportMeasures.JOB_REVENUE]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
    dimensions: [ReportDimensions.FIELD_NAME, ReportDimensions.SERVICE_NAME],
  },
  [ReportMeasures.JOB_EXPENSE]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
    dimensions: [ReportDimensions.FIELD_NAME, ReportDimensions.SERVICE_NAME],
  },
  [ReportMeasures.JOB_COUNT]: {
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
    dimensions: [ReportDimensions.FIELD_NAME, ReportDimensions.SERVICE_NAME],
  },
};

export const dimensionMapping: Record<ReportDimensions, { measures: ReportMeasures[]; times: ReportTime[] }> = {
  [ReportDimensions.ORDER_CITY]: {
    measures: [
      ReportMeasures.ORDER_CUSTOMERS,
      ReportMeasures.ORDER_COUNT,
      ReportMeasures.ORDER_AVERAGE_JOBS,
      ReportMeasures.ORDER_AVERAGE_REVENUE,
      ReportMeasures.ORDER_REVENUE,
      ReportMeasures.ORDER_JOBS,
    ],
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
  },
  [ReportDimensions.ORDER_POSTAL]: {
    measures: [
      ReportMeasures.ORDER_CUSTOMERS,
      ReportMeasures.ORDER_COUNT,
      ReportMeasures.ORDER_AVERAGE_JOBS,
      ReportMeasures.ORDER_AVERAGE_REVENUE,
      ReportMeasures.ORDER_REVENUE,
      ReportMeasures.ORDER_JOBS,
    ],
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
  },
  [ReportDimensions.CUSTOMER_NAME]: {
    measures: [
      ReportMeasures.PAYMENT_AMOUNT,
      ReportMeasures.PAYMENT_COUNT,
      ReportMeasures.ORDER_AVERAGE_REVENUE,
      ReportMeasures.ORDER_REVENUE,
      ReportMeasures.ORDER_COUNT,
      ReportMeasures.ORDER_AVERAGE_JOBS,
      ReportMeasures.JOB_COUNT,
      ReportMeasures.INVOICE_COUNT,
      ReportMeasures.INVOICE_AMOUNT,
    ],
    times: [ReportTime.CUSTOMER_FIRST_ORDER],
  },
  [ReportDimensions.CUSTOMER_UNIQUE_SERVICES]: {
    measures: [ReportMeasures.CUSTOMER_COUNT],
    times: [ReportTime.ORDER_CREATED, ReportTime.CUSTOMER_FIRST_ORDER],
  },
  [ReportDimensions.FIELD_NAME]: {
    measures: [ReportMeasures.FIELD_NUMBER, ReportMeasures.FIELD_JOBS],
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
  },
  [ReportDimensions.INVOICE_PAID]: {
    measures: [ReportMeasures.INVOICE_AMOUNT, ReportMeasures.INVOICE_COUNT],
    times: [ReportTime.INVOICE_CREATED],
  },
  [ReportDimensions.SERVICE_NAME]: {
    measures: [
      ReportMeasures.JOB_COUNT,
      ReportMeasures.JOB_REVENUE,
      ReportMeasures.JOB_AVERAGE_REVENUE,
      ReportMeasures.JOB_EXPENSE,
    ],
    times: [ReportTime.ORDER_CREATED, ReportTime.JOB_ACCRUAL, ReportTime.JOB_CREATED],
  },
};

const queries: Record<PremadeVendorReport, { title: string; query: Query; desc: string }> = {
  [PremadeVendorReport.SERVICE_PENETRATION]: {
    title: 'Service Penetration',
    desc: 'The number of customers who have ordered each service.',
    query: {
      dimensions: [ReportDimensions.SERVICE_NAME],
      measures: [ReportMeasures.CUSTOMER_COUNT],
    },
  },
  [PremadeVendorReport.AVERAGE_JOBS_PER_ORDER]: {
    title: 'Average Jobs per Order',
    desc: 'The average number of jobs that exist in each order.',
    query: {
      measures: [ReportMeasures.ORDER_AVERAGE_JOBS],
      timeDimensions: [{ dimension: ReportTime.ORDER_CREATED, granularity: 'month' }],
    },
  },
  [PremadeVendorReport.CUSTOMER_SERVICE_DIVERSITY]: {
    title: 'Customer Service Diversity',
    desc: 'Buckets customers based upon the number of unique services they have ordered.',
    query: {
      measures: [ReportMeasures.CUSTOMER_COUNT],
      dimensions: [ReportDimensions.CUSTOMER_UNIQUE_SERVICES],
      filters: [{ member: ReportDimensions.CUSTOMER_UNIQUE_SERVICES, operator: 'gt', values: ['0'] }],
    },
  },
  [PremadeVendorReport.CUSTOMER_LTV]: {
    title: 'Customer Lifetime Value',
    desc: 'The total order and revenue of customers since the time of their first order.',
    query: {
      measures: [ReportMeasures.CUSTOMER_REVENUE, ReportMeasures.CUSTOMER_ORDERS],
      timeDimensions: [{ dimension: ReportTime.CUSTOMER_FIRST_ORDER, granularity: 'quarter' }],
    },
  },
  [PremadeVendorReport.NEW_CUSTOMERS]: {
    title: 'New Customers',
    desc: 'The number of customers who made their first purchase.',
    query: {
      measures: [ReportMeasures.CUSTOMER_COUNT],
      timeDimensions: [{ dimension: ReportTime.CUSTOMER_FIRST_ORDER, granularity: 'month' }],
    },
  },
  [PremadeVendorReport.NUMERIC_JOB_FIELDS]: {
    title: 'Numeric Job Fields',
    desc: 'The sum of values (either selected or manually entered) that belong to custom fields on a service.',
    query: {
      measures: [ReportMeasures.FIELD_NUMBER],
      dimensions: [ReportDimensions.FIELD_NAME],
    },
  },
  [PremadeVendorReport.SERVICE_REVENUE]: {
    title: 'Service Revenue',
    desc: 'The total revenue from service-based jobs, using the schedule date (if on-site), otherwise the creation date.',
    query: {
      measures: [ReportMeasures.JOB_REVENUE],
      timeDimensions: [{ dimension: ReportTime.JOB_ACCRUAL, granularity: 'month' }],
      dimensions: [ReportDimensions.SERVICE_NAME],
    },
  },
  [PremadeVendorReport.PAID_INVOICES]: {
    title: 'Paid Invoices',
    desc: 'The total number of paid and unpaid invoices.',
    query: {
      measures: [ReportMeasures.INVOICE_AMOUNT],
      timeDimensions: [{ dimension: ReportTime.INVOICE_CREATED, granularity: 'month' }],
      dimensions: [ReportDimensions.INVOICE_PAID],
    },
  },
  [PremadeVendorReport.AVERAGE_ORDER_AMOUNT]: {
    title: 'Average Order Amount',
    desc: 'The average dollar amount across customer invoices.',
    query: {
      measures: [ReportMeasures.ORDER_AVERAGE_REVENUE],
      timeDimensions: [{ dimension: ReportTime.ORDER_CREATED, granularity: 'month' }],
    },
  },
  [PremadeVendorReport.TOP_CUSTOMERS]: {
    title: 'Top Customers by Revenue',
    desc: 'A breakdown of customers based upon historic order revenue.',
    query: {
      measures: [ReportMeasures.CUSTOMER_REVENUE],
      dimensions: [ReportDimensions.CUSTOMER_NAME],
    },
  },
  [PremadeVendorReport.ORDER_TREND]: {
    title: 'Order Revenue Trend',
    desc: 'The number of orders (and their revenue) over time.',
    query: {
      measures: [ReportMeasures.ORDER_REVENUE, ReportMeasures.ORDER_COUNT, ReportMeasures.ORDER_AVERAGE_REVENUE],
      timeDimensions: [{ dimension: ReportTime.ORDER_CREATED, granularity: 'month' }],
    },
  },
  [PremadeVendorReport.JOB_TREND]: {
    title: 'Job Revenue Trend',
    desc: 'The number of jobs (and their revenue) over time.',
    query: {
      measures: [ReportMeasures.JOB_REVENUE, ReportMeasures.JOB_COUNT, ReportMeasures.JOB_AVERAGE_REVENUE],
      timeDimensions: [{ dimension: ReportTime.JOB_CREATED, granularity: 'month' }],
    },
  },
};

export default queries;
