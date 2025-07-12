
import type { StaffRole } from "./patient";

export interface Spectra {
  id: string; // The spectra number itself, e.g., "SPEC-1234"
  inService: boolean;
}

export interface Nurse {
  id: string;
  name: string;
  role: StaffRole;
  spectra: string;
  relief?: string;
  assignedPatientIds: (string | null)[];
  gridRow: number;
  gridColumn: number;
}

export interface PatientCareTech {
    id: string;
    name: string;
    spectra: string;
    assignmentGroup: string;
    gridRow: number;
    gridColumn: number;
}
