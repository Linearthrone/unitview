
import type { Spectra } from '@/types/nurse';

export const generateInitialSpectra = (): Spectra[] => {
  return [
    { id: 'SPEC-8430', inService: true },
    { id: 'SPEC-9102', inService: true },
    { id: 'SPEC-7754', inService: true },
    { id: 'SPEC-6021', inService: true },
    { id: 'SPEC-5555', inService: true },
    { id: 'SPEC-4321', inService: true },
    { id: 'SPEC-9876', inService: false },
    { id: 'SPEC-1122', inService: true },
  ];
};
