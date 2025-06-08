
import type { LucideIcon } from 'lucide-react';

export type MobilityStatus = 'Bed Rest' | 'Assisted' | 'Independent';

export type PatientGender = 'Male' | 'Female';

export interface Patient {
  id: string;
  bedNumber: number;
  name: string;
  admitDate: Date;
  dischargeDate: Date;
  mobility: MobilityStatus;
  gender?: PatientGender; // Optional: can be undefined
  isFallRisk: boolean;
  isIsolation: boolean;
  isInRestraints: boolean;
  isComfortCareDNR: boolean;
  notes?: string;
  gridRow: number; // 1-indexed
  gridColumn: number; // 1-indexed
}

export interface AlertDisplayInfo {
  IconComponent: LucideIcon;
  colorClass: string;
  tooltipText: string;
}
