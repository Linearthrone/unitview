
import type { Patient } from '@/types/patient';
import { getPerimeterCells, NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils'; // Added import

export type LayoutName = 'default' | 'eighthFloor' | 'tenthFloor';

// Helper function to get a copy of base patients to avoid direct mutation
const getClonedPatients = (basePatients: Patient[]): Patient[] => 
  basePatients.map(p => ({ ...p }));

// Default layout: Uses the initial positions from generateInitialPatients logic (now centralized)
export const defaultLayout = (basePatients: Patient[]): Patient[] => {
  const clonedPatients = getClonedPatients(basePatients);
  const perimeterCells = getPerimeterCells();
  return clonedPatients.map((patient, index) => {
    const pos = perimeterCells[index % perimeterCells.length];
    patient.gridRow = pos.row;
    patient.gridColumn = pos.col;
    return patient;
  });
};

// 8th Floor Layout: Example - groups patients in the top-left quadrant
export const eighthFloorLayout = (basePatients: Patient[]): Patient[] => {
  const clonedPatients = getClonedPatients(basePatients);
  let patientIndex = 0;
  for (let r = 1; r <= Math.floor(NUM_ROWS_GRID / 2) && patientIndex < clonedPatients.length; r++) {
    for (let c = 1; c <= Math.floor(NUM_COLS_GRID / 2) && patientIndex < clonedPatients.length; c++) {
      clonedPatients[patientIndex].gridRow = r;
      clonedPatients[patientIndex].gridColumn = c;
      patientIndex++;
    }
  }
  // Place remaining patients (if any) along the perimeter or another defined logic
  const perimeterCells = getPerimeterCells();
  for (; patientIndex < clonedPatients.length; patientIndex++) {
    const pos = perimeterCells[patientIndex % perimeterCells.length]; // Use a different part of perimeter if needed
    clonedPatients[patientIndex].gridRow = pos.row;
    clonedPatients[patientIndex].gridColumn = pos.col;
  }
  return clonedPatients;
};

// 10th Floor Layout: Example - groups patients in the bottom-right quadrant
export const tenthFloorLayout = (basePatients: Patient[]): Patient[] => {
  const clonedPatients = getClonedPatients(basePatients);
  let patientIndex = 0;
  const startRow = Math.floor(NUM_ROWS_GRID / 2) + 1;
  const startCol = Math.floor(NUM_COLS_GRID / 2) + 1;

  for (let r = startRow; r <= NUM_ROWS_GRID && patientIndex < clonedPatients.length; r++) {
    for (let c = startCol; c <= NUM_COLS_GRID && patientIndex < clonedPatients.length; c++) {
      clonedPatients[patientIndex].gridRow = r;
      clonedPatients[patientIndex].gridColumn = c;
      patientIndex++;
    }
  }
  // Place remaining patients (if any)
  const perimeterCells = getPerimeterCells();
  for (; patientIndex < clonedPatients.length; patientIndex++) {
    // Offset index to try and use different perimeter spots than default
    const pos = perimeterCells[(patientIndex + Math.floor(perimeterCells.length / 2)) % perimeterCells.length]; 
    clonedPatients[patientIndex].gridRow = pos.row;
    clonedPatients[patientIndex].gridColumn = pos.col;
  }
  return clonedPatients;
};

export const layouts: Record<LayoutName, (basePatients: Patient[]) => Patient[]> = {
  default: defaultLayout,
  eighthFloor: eighthFloorLayout,
  tenthFloor: tenthFloorLayout,
};
