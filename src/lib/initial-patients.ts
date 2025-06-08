
import type { Patient, MobilityStatus, PatientGender } from '@/types/patient';

const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];
const GENDERS: PatientGender[] = ['Male', 'Female'];
const NUM_COLS_GRID = 22;
const NUM_ROWS_GRID = 12;

export const generateInitialPatients = (): Patient[] => {
  const patients: Patient[] = [];
  const today = new Date();

  const perimeterCells: { row: number; col: number }[] = [];

  // Top row (left to right)
  for (let c = 1; c <= NUM_COLS_GRID; c++) {
    perimeterCells.push({ row: 1, col: c });
  }
  // Right column (top to bottom, skipping already added top-right corner)
  for (let r = 2; r <= NUM_ROWS_GRID; r++) {
    perimeterCells.push({ row: r, col: NUM_COLS_GRID });
  }
  // Bottom row (right to left, skipping already added bottom-right corner)
  for (let c = NUM_COLS_GRID - 1; c >= 1; c--) {
    perimeterCells.push({ row: NUM_ROWS_GRID, col: c });
  }
  // Left column (bottom to top, skipping already added bottom-left and top-left corners)
  for (let r = NUM_ROWS_GRID - 1; r >= 2; r--) {
    perimeterCells.push({ row: r, col: 1 });
  }

  for (let i = 0; i < 48; i++) {
    const admitDate = new Date(today);
    admitDate.setDate(today.getDate() - Math.floor(Math.random() * 10));

    const dischargeDate = new Date(admitDate);
    dischargeDate.setDate(admitDate.getDate() + Math.floor(Math.random() * 14) + 1);

    const position = perimeterCells[i % perimeterCells.length]; 

    patients.push({
      id: `patient-${i + 1}`,
      bedNumber: i + 1,
      name: `Patient ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      admitDate: admitDate,
      dischargeDate: dischargeDate,
      mobility: MOBILITY_STATUSES[i % MOBILITY_STATUSES.length],
      gender: GENDERS[i % GENDERS.length],
      isFallRisk: Math.random() > 0.7,
      isIsolation: Math.random() > 0.8,
      isInRestraints: Math.random() > 0.9, // Approx 10%
      isComfortCareDNR: Math.random() > 0.85, // Approx 15%
      notes: Math.random() > 0.75 ? `Additional note for patient ${i + 1}. Lorem ipsum dolor sit amet.` : undefined,
      gridRow: position.row,
      gridColumn: position.col,
    });
  }
  return patients;
};
