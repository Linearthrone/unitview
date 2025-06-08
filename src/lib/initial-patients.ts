
import type { Patient, MobilityStatus } from '@/types/patient';

const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];
const NUM_COLS_GRID = 22; // Define number of columns for initial layout

export const generateInitialPatients = (): Patient[] => {
  const patients: Patient[] = [];
  const today = new Date();

  for (let i = 0; i < 48; i++) {
    const admitDate = new Date(today);
    admitDate.setDate(today.getDate() - Math.floor(Math.random() * 10));

    const dischargeDate = new Date(admitDate);
    dischargeDate.setDate(admitDate.getDate() + Math.floor(Math.random() * 14) + 1);

    patients.push({
      id: `patient-${i + 1}`,
      bedNumber: i + 1, 
      name: `Patient ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      admitDate: admitDate,
      dischargeDate: dischargeDate,
      mobility: MOBILITY_STATUSES[i % MOBILITY_STATUSES.length],
      isFallRisk: Math.random() > 0.7,
      isIsolation: Math.random() > 0.8,
      notes: Math.random() > 0.75 ? `Additional note for patient ${i + 1}. Lorem ipsum dolor sit amet.` : undefined,
      gridRow: Math.floor(i / NUM_COLS_GRID) + 1,
      gridColumn: (i % NUM_COLS_GRID) + 1,
    });
  }
  return patients;
};
