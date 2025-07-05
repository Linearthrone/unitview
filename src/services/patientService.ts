import type { Patient, LayoutName } from '@/types/patient';
import type { AdmitPatientFormValues } from '@/components/admit-patient-dialog';
import { generateInitialPatients } from '@/lib/initial-patients';
import { layouts as appLayouts } from '@/lib/layouts';

interface StoredPatientPosition {
  id: string;
  gridRow: number;
  gridColumn: number;
}

const getStorageKey = (layoutName: LayoutName) => `patientGridLayout_${layoutName}`;

export function getPatients(layoutName: LayoutName): Patient[] {
    const basePatients = generateInitialPatients();
    const storageKey = getStorageKey(layoutName);
    let finalPatientsData: Patient[];

    try {
        const savedLayoutJSON = localStorage.getItem(storageKey);
        if (savedLayoutJSON) {
            const savedPositions = JSON.parse(savedLayoutJSON) as StoredPatientPosition[];
            const positionMap = new Map(savedPositions.map(p => [p.id, { gridRow: p.gridRow, gridColumn: p.gridColumn }]));
            finalPatientsData = basePatients.map(p => {
                const savedPos = positionMap.get(p.id);
                return savedPos ? { ...p, ...savedPos } : { ...p };
            });
        } else {
            finalPatientsData = appLayouts[layoutName] ? appLayouts[layoutName](basePatients) : basePatients;
        }
    } catch (error) {
        console.error(`Error processing patient layout ${layoutName} from localStorage:`, error);
        finalPatientsData = appLayouts[layoutName] ? appLayouts[layoutName](basePatients) : basePatients;
    }
    return finalPatientsData;
}

export function savePatients(layoutName: LayoutName, patients: Patient[]): void {
    const storageKey = getStorageKey(layoutName);
    try {
        const positionsToSave: StoredPatientPosition[] = patients.map(p => ({ id: p.id, gridRow: p.gridRow, gridColumn: p.gridColumn }));
        localStorage.setItem(storageKey, JSON.stringify(positionsToSave));
    } catch (error) {
        console.error(`Error saving patient layout ${layoutName}:`, error);
    }
}

export function admitPatient(formData: AdmitPatientFormValues, patients: Patient[]): Patient[] {
    return patients.map(p => {
        if (p.bedNumber === formData.bedNumber) {
            return {
                ...p,
                name: formData.name,
                age: formData.age,
                gender: formData.gender,
                assignedNurse: formData.assignedNurse,
                chiefComplaint: formData.chiefComplaint,
                admitDate: formData.admitDate,
                dischargeDate: formData.dischargeDate,
                ldas: formData.ldas ? formData.ldas.split(',').map(s => s.trim()).filter(Boolean) : [],
                diet: formData.diet,
                mobility: formData.mobility,
                codeStatus: formData.codeStatus,
                isFallRisk: formData.isFallRisk,
                isSeizureRisk: formData.isSeizureRisk,
                isAspirationRisk: formData.isAspirationRisk,
                isIsolation: formData.isIsolation,
                isInRestraints: formData.isInRestraints,
                isComfortCareDNR: formData.isComfortCareDNR,
                notes: '',
            };
        }
        return p;
    });
}

export function dischargePatient(patientToDischarge: Patient, patients: Patient[]): Patient[] {
    const vacantPatient: Patient = {
      ...patientToDischarge,
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
      notes: '',
    };
    return patients.map(p => (p.id === patientToDischarge.id ? vacantPatient : p));
}
