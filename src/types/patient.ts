import type { LucideIcon } from 'lucide-react';

export type MobilityStatus = 'Bed Rest' | 'Assisted' | 'Independent';
export type PatientGender = 'Male' | 'Female';
export type CodeStatus = 'Full Code' | 'DNR' | 'DNI' | 'DNR/DNI';
export type LayoutName = string;
export type OrientationStatus = 'x1' | 'x2' | 'x3' | 'x4' | 'N/A';

export interface Patient {
  id: string;
  bedNumber: number; // internal unique id for the room/slot
  roomDesignation: string; // user-facing name for the room, e.g., "Bed 101" or "Trauma 1"
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
  orientationStatus: OrientationStatus;
  assignedNurse?: string;
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
