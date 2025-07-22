
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp, query, limit } from 'firebase/firestore';
import type { Patient, LayoutName } from '@/types/patient';
import type { AdmitPatientFormValues } from '@/types/forms';
import { mockPatientData } from '@/lib/mock-patients';
import { NUM_COLS_GRID, NUM_ROWS_GRID, getPerimeterCells } from '@/lib/grid-utils';
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

// Converts JS Dates to Firestore Timestamps for writing
const patientToFirestore = (patient: Patient): any => {
    return {
        ...patient,
        admitDate: Timestamp.fromDate(patient.admitDate),
        dischargeDate: Timestamp.fromDate(patient.dischargeDate),
    };
}

const getCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'patients');


// This function seeds the predefined "North-South View" layout
async function seedNorthSouthLayout(): Promise<Patient[]> {
    const layoutName = 'North-South View';
    const layoutPatients: Patient[] = [];
    const perimeterCells = getPerimeterCells();
    
    // We'll create a standard 40-room layout using the perimeter
    const numRooms = Math.min(40, perimeterCells.length);
    const startingRoomNumber = 801;

    for (let i = 0; i < numRooms; i++) {
        const cell = perimeterCells[i];
        const currentRoomNumber = startingRoomNumber + i;
        const patient: Patient = {
            id: `patient-ns-${currentRoomNumber}`,
            bedNumber: currentRoomNumber,
            roomDesignation: `Room ${currentRoomNumber}`,
            name: 'Vacant',
            age: 0,
            admitDate: new Date(),
            dischargeDate: new Date(),
            chiefComplaint: 'N/A',
            ldas: [],
            diet: 'N/A',
            mobility: 'Independent',
            codeStatus: 'Full Code',
            orientationStatus: 'N/A',
            isFallRisk: false,
            isSeizureRisk: false,
            isAspirationRisk: false,
            isIsolation: false,
            isInRestraints: false,
            isComfortCareDNR: false,
            gridRow: cell.row,
            gridColumn: cell.col,
        };
        layoutPatients.push(patient);
    }
    
    await savePatients(layoutName, layoutPatients);
    return layoutPatients;
}


export async function getPatients(layoutName: LayoutName): Promise<Patient[]> {
    const collectionRef = getCollectionRef(layoutName);
    try {
        // Query for just one doc to see if the collection exists and has data.
        const q = query(collectionRef, limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Special case: if the "North-South View" is selected and empty, seed it.
            if (layoutName === 'North-South View') {
                console.log(`No data for layout '${layoutName}' in Firestore. Seeding initial layout.`);
                return await seedNorthSouthLayout();
            }
            // For any other layout (including custom ones), return an empty array if not found.
            return [];
        }

        // If data exists, fetch all documents.
        const allDocsSnapshot = await getDocs(collectionRef);
        return allDocsSnapshot.docs.map(doc => patientFromFirestore(doc.data()));

    } catch (error) {
        console.error(`Error fetching patient layout ${layoutName} from Firestore:`, error);
         // If there's an error (e.g., permissions), still try to seed the default layout if it's the one requested.
         if (layoutName === 'North-South View') {
            return await seedNorthSouthLayout();
        }
        return [];
    }
}

export async function savePatients(layoutName: LayoutName, patients: Patient[]): Promise<void> {
    if (!patients) return; // Can be an empty array

    const collectionRef = getCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        // Since we are overwriting the whole layout, we can delete all first.
        // For more granular updates, a different strategy would be needed.
        const existingDocs = await getDocs(collectionRef);
        existingDocs.forEach(doc => batch.delete(doc.ref));
        
        // Then add all the new/updated patient data.
        patients.forEach(patient => {
            const docRef = doc(collectionRef, patient.id);
            const dataForFirestore = patientToFirestore(patient);
            batch.set(docRef, dataForFirestore);
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

export async function dischargePatient(patientToDischarge: Patient, patients: Patient[]): Promise<Patient[]> {
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


export async function createRoom(
  designation: string,
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
): Promise<{ newPatients: Patient[] | null; error?: string }> {
  const position = findEmptySlotForPatient(patients, nurses, techs);
  if (!position) {
    return { newPatients: null, error: "No empty space on the grid to add a new room." };
  }

  const newBedNumber = Math.max(0, ...patients.map(p => p.bedNumber)) + 1;
  const sanitizedDesignation = designation.trim().replace(/[\s/]/g, '-');

  const newRoom: Patient = {
    id: `room-${sanitizedDesignation}-${newBedNumber}-${Math.random().toString(36).slice(2, 9)}`,
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

export async function insertMockPatients(currentPatients: Patient[]): Promise<{ updatedPatients: Patient[], insertedCount: number }> {
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

    
