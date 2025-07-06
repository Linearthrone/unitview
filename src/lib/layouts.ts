
import type { Patient } from '@/types/patient';

// Helper function to get a copy of base patients to avoid direct mutation
const getClonedPatients = (basePatients: Patient[]): Patient[] =>
  basePatients.map(p => ({ ...p }));

// Default layout: Now just returns the base patients, which is a minimal set.
export const defaultLayout = (basePatients: Patient[]): Patient[] => {
  return getClonedPatients(basePatients);
};

export const layouts: Record<string, (basePatients: Patient[]) => Patient[]> = {
  default: defaultLayout,
};
