export interface Patient {
  name: string;
  roomDesignation: string;
  bedNumber: number;
  admitDate: Date;
  dischargeDate: Date;
  gender: string;
  diet: string;
  mobility: string;
  codeStatus: string;
  ldas: string;
  notes?: string;
  assignedNurse?: string;
  isFallRisk: boolean;
  isSeizureRisk: boolean;
  isAspirationRisk: boolean;
  isIsolation: boolean;
  isInRestraints: boolean;
  isComfortCareDNR: boolean;
}

export interface Nurse {
  name: string;
  spectra: string;
  relief?: string;
  assignedPatientIds: string[];
}

export interface Room {
  roomNumber: string;
  bedCount: number;
  occupiedBeds: string[];
  isVacant: boolean;
  assignedNurseId?: string;
}

export interface Assignment {
  nurseId: string;
  patientIds: string[];
  timestamp: Date;
  shift: string;
  createdBy: string;
}

export interface Spectralink {
  deviceId: string;
  assignedTo: string; // nurseId
  status: "active" | "inactive" | "lost";
  lastSeen: Date;
}