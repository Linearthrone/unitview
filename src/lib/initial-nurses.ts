
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
  ];
};
