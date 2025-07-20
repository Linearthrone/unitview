
import type { Nurse } from '@/types/nurse';

export const generateInitialNurses = (): Omit<Nurse, 'spectra'>[] => {
  return [
    {
      id: 'nurse-1',
      name: 'RN Alice',
      relief: 'RN Eve',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 2,
      gridColumn: 5,
    },
    {
      id: 'nurse-2',
      name: 'RN Bob',
      relief: 'RN Frank',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 2,
      gridColumn: 6,
    },
    {
      id: 'nurse-3',
      name: 'RN Charlie',
      relief: 'RN Grace',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 2,
      gridColumn: 11,
    },
    {
      id: 'nurse-4',
      name: 'RN David',
      relief: 'RN Heidi',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 2,
      gridColumn: 12,
    },
    {
      id: 'nurse-5',
      name: 'RN Mallory',
      relief: 'RN Ivan',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 2,
      gridColumn: 7,
    },
     {
      id: 'nurse-6',
      name: 'RN Judy',
      relief: 'RN Trent',
      assignedPatientIds: Array(6).fill(null),
      gridRow: 2,
      gridColumn: 8,
    },
  ];
};
