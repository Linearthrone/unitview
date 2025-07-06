
import type { Patient } from '@/types/patient';

export const generateInitialPatients = (): Patient[] => {
  return [
    {
      id: `patient-${Date.now()}`,
      bedNumber: 1,
      roomDesignation: `Bed 1`,
      name: 'Vacant',
      age: 0,
      gender: undefined,
      admitDate: new Date(),
      dischargeDate: new Date(),
      chiefComplaint: 'N/A',
      ldas: [],
      diet: 'N/A',
      mobility: 'Independent',
      codeStatus: 'Full Code',
      assignedNurse: undefined,
      isFallRisk: false,
      isSeizureRisk: false,
      isAspirationRisk: false,
      isIsolation: false,
      isInRestraints: false,
      isComfortCareDNR: false,
      notes: undefined,
      gridRow: 1,
      gridColumn: 2,
    },
  ];
};
