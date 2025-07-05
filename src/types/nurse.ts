
export interface Nurse {
  id: string;
  name: string;
  spectra: string; // Employee ID or similar
  relief?: string; // Name of relief nurse
  assignedPatientIds: (string | null)[]; // Array of 6, string is patient.id
  gridRow: number;
  gridColumn: number;
}
