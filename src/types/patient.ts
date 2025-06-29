import type { LucideIcon } from 'lucide-react';

export type MobilityStatus = 'Bed Rest' | 'Assisted' | 'Independent';
export type PatientGender = 'Male' | 'Female';
export type CodeStatus = 'Full Code' | 'DNR' | 'DNI' | 'DNR/DNI';
export type LayoutName = string;

export interface Patient {
  id: string;
  bedNumber: number;
  name: string;
  age: number;
  gender?: PatientGender;
  admitDate: Date;
  dischargeDate: Date; // This is EDD
  chiefComplaint: string;
  ldas: string[]; // Lines, Drains, Airways
  diet: string;
  mobility: MobilityStatus;
  codeStatus: CodeStatus;
  isFallRisk: boolean;
  isSeizureRisk: boolean;
  isAspirationRisk: boolean;
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
