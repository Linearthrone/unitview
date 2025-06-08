
import type { LucideIcon } from 'lucide-react';

export type MobilityStatus = 'Bed Rest' | 'Assisted' | 'Independent';

export interface Patient {
  id: string;
  bedNumber: number;
  name: string;
  admitDate: Date;
  dischargeDate: Date;
  mobility: MobilityStatus;
  isFallRisk: boolean;
  isIsolation: boolean;
  notes?: string;
  gridRow: number; // 1-indexed
  gridColumn: number; // 1-indexed
}

export interface AlertDisplayInfo {
  IconComponent: LucideIcon;
  colorClass: string;
  tooltipText: string;
}
