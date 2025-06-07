import type { Patient, MobilityStatus } from '@/types/patient';

const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];

export const generateInitialPatients = (): Patient[] => {
  const patients: Patient[] = [];
  const today = new Date();

  for (let i = 0; i < 48; i++) {
    const admitDate = new Date(today);
    admitDate.setDate(today.getDate() - Math.floor(Math.random() * 10)); // Admit date within the last 10 days

    const dischargeDate = new Date(admitDate);
    dischargeDate.setDate(admitDate.getDate() + Math.floor(Math.random() * 14) + 1); // Discharge date within next 1-14 days

    patients.push({
      id: `patient-${i + 1}`,
      bedNumber: i + 1,
      name: `Patient ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`, // Patient A, B, ..., Z, A1, B1 ...
      admitDate: admitDate,
      dischargeDate: dischargeDate,
      mobility: MOBILITY_STATUSES[i % MOBILITY_STATUSES.length],
      isFallRisk: Math.random() > 0.7, // Approx 30% fall risk
      isIsolation: Math.random() > 0.8, // Approx 20% isolation
      notes: Math.random() > 0.75 ? `Additional note for patient ${i + 1}. Lorem ipsum dolor sit amet.` : undefined,
      order: i,
    });
  }
  return patients;
};
