
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import type { Patient, LayoutName, WidgetCard } from '@/types/patient';
import type { AdmitPatientFormValues } from '@/types/forms';
import { generateInitialPatients } from '@/lib/initial-patients';
import { mockPatientData } from '@/lib/mock-patients';
import { layouts as appLayouts } from '@/lib/layouts';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';
import type { Nurse, PatientCareTech } from '@/types/nurse';

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
            
            // Removed the slow initial write operation. Data will be saved on first user change.
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
    if (!patients) { // Can be an empty array
        return;
    }
    const collectionRef = getCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        patients.forEach(patient => {
            const docRef = doc(collectionRef, patient.id);
            // The Firebase SDK handles JS Date conversion to Timestamp automatically.
            // Undefined fields are handled by the initializeFirestore setting.
            batch.set(docRef, patient);
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
                orientationStatus: formData.orientationStatus,
                isFallRisk: formData.isFallRisk,
                isSeizureRisk: formData.isSeizureRisk,
                isAspirationRisk: formData.isAspirationRisk,
                isIsolation: formData.isIsolation,
                isInRestraints: formData.isInRestraints,
                isComfortCareDNR: formData.isComfortCareDNR,
                notes: formData.notes,
                isBlocked: false, // Admitting unblocks the room
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
      orientationStatus: 'N/A',
      notes: '',
      isBlocked: patientToDischarge.isBlocked, // Preserve blocked status
    };
    return patients.map(p => (p.id === patientToDischarge.id ? vacantPatient : p));
}

function findEmptySlotForPatient(
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
  widgets: WidgetCard[]
): { row: number; col: number } | null {
  const occupiedCells = new Set<string>();
  
  patients.forEach(p => {
    if (p.gridRow > 0 && p.gridColumn > 0) {
      occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
    }
  });

  nurses.forEach(n => {
    for (let i = 0; i < 3; i++) { // Nurse card is 3 rows high
      occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
    }
  });
  
  techs.forEach(t => {
      occupiedCells.add(`${t.gridRow}-${t.gridColumn}`);
  });

  widgets.forEach(w => {
    for (let r = 0; r < w.height; r++) {
      for (let c = 0; c < w.width; c++) {
        occupiedCells.add(`${w.gridRow + r}-${w.gridColumn + c}`);
      }
    }
  });

  // Prioritize inner grid first
  for (let r = 2; r < NUM_ROWS_GRID; r++) {
    for (let c = 2; c < NUM_COLS_GRID; c++) {
      if (!occupiedCells.has(`${r}-${c}`)) {
        return { row: r, col: c };
      }
    }
  }
  // Then check full grid
  for (let r = 1; r <= NUM_ROWS_GRID; r++) {
    for (let c = 1; c <= NUM_COLS_GRID; c++) {
      if (!occupiedCells.has(`${r}-${c}`)) {
        return { row: r, col: c };
      }
    }
  }

  return null;
}


export function createRoom(
  designation: string,
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
  widgets: WidgetCard[]
): { newPatients: Patient[] | null; error?: string } {
  const position = findEmptySlotForPatient(patients, nurses, techs, widgets);
  if (!position) {
    return { newPatients: null, error: "No empty space on the grid to add a new room." };
  }

  const newBedNumber = Math.max(0, ...patients.map(p => p.bedNumber)) + 1;

  const newRoom: Patient = {
    id: `room-${designation.trim().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 9)}`,
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
    orientationStatus: 'N/A',
    notes: undefined,
    gridRow: position.row,
    gridColumn: position.col,
  };

  return { newPatients: [...patients, newRoom] };
}


// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export function insertMockPatients(currentPatients: Patient[]): { updatedPatients: Patient[], insertedCount: number } {
  const vacantRooms = currentPatients.filter(p => p.name === 'Vacant' && !p.isBlocked);
  
  if (vacantRooms.length === 0) {
    return { updatedPatients: currentPatients, insertedCount: 0 };
  }

  const shuffledMockData = shuffleArray([...mockPatientData]);
  const newPatients = [...currentPatients];
  let insertedCount = 0;

  for (let i = 0; i < vacantRooms.length; i++) {
    const mockData = shuffledMockData[i % shuffledMockData.length]; // Loop through mock data if more vacant rooms than mocks
    const vacantRoom = vacantRooms[i];
    const patientIndex = newPatients.findIndex(p => p.id === vacantRoom.id);

    if (patientIndex !== -1) {
      newPatients[patientIndex] = {
        ...newPatients[patientIndex],
        ...mockData,
        admitDate: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 5))),
        dischargeDate: new Date(new Date().setDate(new Date().getDate() + Math.floor(Math.random() * 10) + 2)),
      };
      insertedCount++;
    }
  }

  return { updatedPatients: newPatients, insertedCount };
}
