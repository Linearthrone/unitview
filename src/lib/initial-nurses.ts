
import type { Nurse } from '@/types/nurse';

export const generateInitialNurses = (): Nurse[] => {
  return [
    {
      id: 'nurse-1',
      name: 'RN Alice',
      spectra: 'SPEC-8430',
      relief: 'RN Eve',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 1,
      gridColumn: 5,
    },
    {
      id: 'nurse-2',
      name: 'RN Bob',
      spectra: 'SPEC-9102',
      relief: 'RN Frank',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 1,
      gridColumn: 11,
    },
    {
      id: 'nurse-3',
      name: 'RN Carol',
      spectra: 'SPEC-7754',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 5,
      gridColumn: 5,
    },
    {
      id: 'nurse-4',
      name: 'RN David',
      spectra: 'SPEC-6021',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 5,
      gridColumn: 11,
    },
  ];
};
