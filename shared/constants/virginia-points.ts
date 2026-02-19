export interface PointTableEntry {
  label: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  points: number;
}

export const VIRGINIA_POINT_TABLE: readonly PointTableEntry[] = [
  { label: 'Birth through 15 months', minAgeMonths: 0, maxAgeMonths: 15, points: 4 },
  { label: '16 months through 23 months', minAgeMonths: 16, maxAgeMonths: 23, points: 3 },
  { label: '2 years through 4 years', minAgeMonths: 24, maxAgeMonths: 59, points: 2 },
  { label: '5 years through 9 years', minAgeMonths: 60, maxAgeMonths: 119, points: 1 },
  { label: '10 years and older', minAgeMonths: 120, maxAgeMonths: Infinity, points: 0 },
] as const;

export const MAX_POINTS_PER_CAREGIVER = 16;
export const SUBSTITUTE_ANNUAL_HOUR_LIMIT = 240;
export const SUBSTITUTE_WARNING_HOURS = [200, 220];
