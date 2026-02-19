export const DEFAULT_BILLING = {
  BILLING_CYCLE: 'weekly' as const,
  WEEK_START_DAY: 1, // Monday
  LATE_PICKUP_GRACE_MINUTES: 15,
  LATE_PICKUP_RATE_PER_MINUTE: 1.0,
  LATE_PAYMENT_GRACE_DAYS: 3,
  LATE_PAYMENT_FEE: 25.0,
  INVOICE_PREFIX: 'DD',
  AGING_CATEGORIES: [
    { label: 'Current', minDays: 0, maxDays: 0 },
    { label: '1-7 days', minDays: 1, maxDays: 7 },
    { label: '8-14 days', minDays: 8, maxDays: 14 },
    { label: '15-30 days', minDays: 15, maxDays: 30 },
    { label: '30+ days', minDays: 31, maxDays: Infinity },
  ],
};

export type PaymentMethod = 'cash' | 'check' | 'money_order' | 'credit_card' | 'ach' | 'zelle' | 'venmo' | 'subsidy' | 'other';
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';
export type ScheduleType = 'full_time' | 'part_time' | 'drop_in' | 'after_school' | 'before_school';
export type AgeGroup = 'infant' | 'toddler' | 'preschool' | 'school_age';
