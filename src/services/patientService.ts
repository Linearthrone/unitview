
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp, query, limit, addDoc } from 'firebase/firestore';
import type { Patient, LayoutName, WidgetCard } from '@/types/patient';
import { mockPatientData } from '@/lib/mock-patients';
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

// Converts JS Dates to Firestore Timestamps for writing
const patientToFirestore = (patient: Patient): any => {
    return {
        ...patient,
        admitDate: Timestamp.fromDate(patient.admitDate),
        dischargeDate: Timestamp.fromDate(patient.dischargeDate),
    };
}

const getCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'patients');


async function seedInitialDataForLayout(layoutName: string): Promise<Patient[]> {
    const roomLayout: { bedNumber: number; row: number; col: number }[] = [
      // Top Row (Right to Left for 811-818, then 819-826)
      { bedNumber: 826, row: 1, col: 1 }, { bedNumber: 825, row: 1, col: 2 },
      { bedNumber: 824, row: 1, col: 3 }, { bedNumber: 823, row: 1, col: 4 },
      { bedNumber: 822, row: 1, col: 5 }, { bedNumber: 821, row: 1, col: 6 },
      { bedNumber: 820, row: 1, col: 7 }, { bedNumber: 819, row: 1, col: 8 },
      // Blank space at col 9
      { bedNumber: 818, row: 1, col: 10 }, { bedNumber: 817, row: 1, col: 11 },
      { bedNumber: 816, row: 1, col: 12 }, { bedNumber: 815, row: 1, col: 13 },
      { bedNumber: 814, row: 1, col: 14 }, { bedNumber: 813, row: 1, col: 15 },
      { bedNumber: 812, row: 1, col: 16 }, { bedNumber: 811, row: 1, col: 17 },

      // Left and Right Columns
      { bedNumber: 827, row: 2, col: 1 },  { bedNumber: 810, row: 2, col: 17 },
      { bedNumber: 828, row: 3, col: 1 },  { bedNumber: 809, row: 3, col: 17 },
      { bedNumber: 829, row: 4, col: 1 },  { bedNumber: 808, row: 4, col: 17 },
      
      // Bottom Rows
      { bedNumber: 830, row: 5, col: 1 },
      { bedNumber: 831, row: 5, col: 2 },  { bedNumber: 832, row: 5, col: 3 },
      { bedNumber: 833, row: 5, col: 4 },  { bedNumber: 834, row: 5, col: 5 },
      { bedNumber: 835, row: 5, col: 6 },  { bedNumber: 836, row: 5, col: 7 },

      { bedNumber: 837, row: 6, col: 7 },  { bedNumber: 838, row: 7, col: 7 },
      { bedNumber: 839, row: 8, col: 7 },  { bedNumber: 840, row: 9, col: 7 },

      { bedNumber: 807, row: 5, col: 17 },
      { bedNumber: 806, row: 5, col: 16 }, { bedNumber: 805, row: 5, col: 15 },
      { bedNumber: 804, row: 5, col: 14 }, { bedNumber: 803, row: 5, col: 13 },
      { bedNumber: 802, row: 5, col: 12 }, { bedNumber: 801, row: 5, col: 11 },
    ];

    const newPatients: Patient[] = [];

    roomLayout.forEach(room => {
        const patient: Patient = {
            id: `patient-${layoutName.replace(/[\/\s]+/g, '-')}-${room.bedNumber}`,
            bedNumber: room.bedNumber,
            roomDesignation: `${room.bedNumber}`,
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
            gridRow: room.row,
            gridColumn: room.col,
        };
        newPatients.push(patient);
    });
    
    await savePatients(layoutName, newPatients);

    return newPatients;
}


export async function getPatients(layoutName: LayoutName): Promise<Patient[]> {
    const collectionRef = getCollectionRef(layoutName);
    try {
        const q = query(collectionRef, limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`No data for layout '${layoutName}' in Firestore. Seeding initial layout.`);
            return await seedInitialDataForLayout(layoutName);
        }

        const allDocsSnapshot = await getDocs(collectionRef);
        return allDocsSnapshot.docs.map(doc => patientFromFirestore(doc.data()));

    } catch (error) {
        console.error(`Error fetching patient layout ${layoutName} from Firestore:`, error);
        return await seedInitialDataForLayout(layoutName);
    }
}

export async function savePatients(layoutName: LayoutName, patients: Patient[]): Promise<void> {
    if (!patients) return;

    const collectionRef = getCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        const existingDocs = await getDocs(collectionRef);
        existingDocs.forEach(doc => batch.delete(doc.ref));
        
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
      isBlocked: patientToDischarge.isBlocked,
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
    for (let i = 0; i < 3; i++) {
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


export async function createRoom(
  designation: string,
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
  widgets: WidgetCard[]
): Promise<{ newPatients: Patient[] | null; error?: string }> {
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
    const mockData = shuffledMockData[i % shuffledMockData.length];
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

