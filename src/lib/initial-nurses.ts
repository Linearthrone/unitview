
import type { Nurse } from '@/types/nurse';

export const generateInitialNurses = (): Omit<Nurse, 'spectra'>[] => {
  return [
    {
      id: 'nurse-1',
      name: 'RN Alice',
      relief: 'RN Eve',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 1,
      gridColumn: 5,
    },
    {
      id: 'nurse-2',
      name: 'RN Bob',
      relief: 'RN Frank',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 1,
      gridColumn: 11,
    },
    {
      id: 'nurse-3',
      name: 'RN Carol',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 5,
      gridColumn: 5,
    },
    {
      id: 'nurse-4',
      name: 'RN David',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 5,
      gridColumn: 11,
    },
  ];
};
