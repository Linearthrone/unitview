
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import type { Patient, LayoutName } from '@/types/patient';
import type { AdmitPatientFormValues } from '@/components/admit-patient-dialog';
import { generateInitialPatients } from '@/lib/initial-patients';
import { layouts as appLayouts } from '@/lib/layouts';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';
import type { Nurse } from '@/types/nurse';

// Helper to remove undefined fields from an object before Firestore write
const cleanDataForFirestore = (data: Record<string, any>) => {
    const cleanedData: Record<string, any> = {};
    for (const key in data) {
        if (data[key] !== undefined) {
            cleanedData[key] = data[key];
        }
    }
    return cleanedData;
};

// Converts Firestore Timestamps to JS Dates in a patient object
const patientFromFirestore = (data: any): Patient => {
    const patientData = data as Patient;
    return {
        ...patientData,
        admitDate: (data.admitDate as Timestamp)?.toDate ? (data.admitDate as Timestamp).toDate() : new Date(),
        dischargeDate: (data.dischargeDate as Timestamp)?.toDate ? (data.dischargeDate as Timestamp).toDate() : new Date(),
    };
}

const getCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'patients');

export async function getPatients(layoutName: LayoutName): Promise<Patient[]> {
    const collectionRef = getCollectionRef(layoutName);
    try {
        const snapshot = await getDocs(collectionRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => patientFromFirestore(doc.data()));
        }

        // Apply predefined layouts only if the layout is not custom
        if (appLayouts[layoutName]) {
            console.log(`No data for layout '${layoutName}' in Firestore. Generating initial layout.`);
            const basePatients = generateInitialPatients();
            const initialLayoutPatients = appLayouts[layoutName](basePatients);
            
            await savePatients(layoutName, initialLayoutPatients);
            return initialLayoutPatients;
        }

        // For custom layouts that might be empty
        return [];

    } catch (error) {
        console.error(`Error fetching patient layout ${layoutName} from Firestore:`, error);
        // Fallback to in-memory generation on error
        if (appLayouts[layoutName]) {
            const basePatients = generateInitialPatients();
            return appLayouts[layoutName](basePatients);
        }
        return [];
    }
}

export async function savePatients(layoutName: LayoutName, patients: Patient[]): Promise<void> {
    if (!patients || patients.length === 0) {
        // To handle clearing a layout, you might want to delete existing docs.
        // For now, we'll just not write anything if the array is empty.
        return;
    }
    const collectionRef = getCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        patients.forEach(patient => {
            const docRef = doc(collectionRef, patient.id);
            // The Firebase SDK handles JS Date conversion to Timestamp automatically.
            batch.set(docRef, cleanDataForFirestore(patient));
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error saving patient layout ${layoutName} to Firestore:`, error);
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
                assignedNurse: formData.assignedNurse === 'To Be Assigned' ? undefined : formData.assignedNurse,
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

function findEmptySlotForPatient(patients: Patient[], nurses: Nurse[]): { row: number; col: number } | null {
    const occupiedCells = new Set<string>();
    patients.forEach(p => {
        if(p.gridColumn > 0 && p.gridRow > 0) {
            occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
        }
    });
    nurses.forEach(n => {
        for (let i = 0; i < 3; i++) {
            occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
        }
    });

    for (let r = 2; r < NUM_ROWS_GRID; r++) {
      for (let c = 2; c < NUM_COLS_GRID; c++) {
        if (!occupiedCells.has(`${r}-${c}`)) {
          return { row: r, col: c };
        }
      }
    }
     for (let r = 1; r <= NUM_ROWS_GRID; r++) {
      for (let c = 1; c <= NUM_COLS_GRID; c++) {
        if (!occupiedCells.has(`${r}-${c}`)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
}

export function createRoom(designation: string, patients: Patient[], nurses: Nurse[]): { newPatients: Patient[] | null, error?: string } {
    const position = findEmptySlotForPatient(patients, nurses);
    if (!position) {
        return { newPatients: null, error: "No empty space on the grid to add a new room." };
    }

    const newBedNumber = Math.max(0, ...patients.map(p => p.bedNumber)) + 1;
    
    const newRoom: Patient = {
      id: `patient-${Date.now()}`,
      bedNumber: newBedNumber,
      roomDesignation: designation,
      name: 'Vacant',
      age: 0,
      gender: undefined,
      assignedNurse: undefined,
      admitDate: new Date(),
      dischargeDate: new Date(),
      chiefComplaint: 'N/A',
      ldas: [],
      diet: 'N/A',
      mobility: 'Independent',
      codeStatus: 'Full Code',
      isFallRisk: false,
      isSeizureRisk: false,
      isAspirationRisk: false,
      isIsolation: false,
      isInRestraints: false,
      isComfortCareDNR: false,
      notes: undefined,
      gridRow: position.row,
      gridColumn: position.col,
    };

    return { newPatients: [...patients, newRoom] };
}
