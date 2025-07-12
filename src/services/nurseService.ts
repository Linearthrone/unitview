
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';
import type { Patient, WidgetCard } from '@/types/patient';
import type { AddStaffMemberFormValues } from '@/types/forms';
import type { LayoutName } from '@/types/patient';
import { generateInitialNurses } from '@/lib/initial-nurses';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

const getNurseCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'nurses');
const getTechCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'techs');

export async function getNurses(layoutName: LayoutName, spectraPool: Spectra[]): Promise<Nurse[]> {
    const collectionRef = getNurseCollectionRef(layoutName);
    try {
        const snapshot = await getDocs(collectionRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => doc.data() as Nurse);
        }

        if (layoutName !== 'default' && layoutName !== '*: North South') {
             // Return empty for non-default layouts if they don't exist
            return [];
        }

        console.log(`No nurse data for layout '${layoutName}' in Firestore. Generating initial nurses.`);
        const initialNurses = generateInitialNurses();
        const availableSpectra = spectraPool.filter(s => s.inService);
        const nursesWithSpectra = initialNurses.map((nurse, index) => ({
            ...nurse,
            spectra: availableSpectra[index]?.id || 'N/A',
        })) as Nurse[];
        
        return nursesWithSpectra;

    } catch (error) {
        console.error(`Error fetching nurse layout ${layoutName} from Firestore:`, error);
        if (layoutName !== 'default' && layoutName !== '*: North South') return [];
        // Fallback to in-memory generation on error for default layout
        const initialNurses = generateInitialNurses();
        const availableSpectra = spectraPool.filter(s => s.inService);
        return initialNurses.map((nurse, index) => ({
            ...nurse,
            spectra: availableSpectra[index]?.id || 'N/A',
        })) as Nurse[];
    }
}

export async function saveNurses(layoutName: LayoutName, nurses: Nurse[]): Promise<void> {
    if (!nurses || nurses.length === 0) {
        return;
    }
    const collectionRef = getNurseCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        nurses.forEach(nurse => {
            const docRef = doc(collectionRef, nurse.id);
            batch.set(docRef, nurse);
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error saving nurse layout ${layoutName} to Firestore:`, error);
    }
}

export async function getTechs(layoutName: LayoutName, spectraPool: Spectra[]): Promise<PatientCareTech[]> {
    const collectionRef = getTechCollectionRef(layoutName);
    try {
        const snapshot = await getDocs(collectionRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => doc.data() as PatientCareTech);
        }
        return [];
    } catch (error) {
        console.error(`Error fetching techs for layout ${layoutName} from Firestore:`, error);
        return [];
    }
}

export async function saveTechs(layoutName: LayoutName, techs: PatientCareTech[]): Promise<void> {
    if (!techs) {
        return;
    }
    const collectionRef = getTechCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        techs.forEach(tech => {
            const docRef = doc(collectionRef, tech.id);
            batch.set(docRef, tech);
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error saving techs for layout ${layoutName} to Firestore:`, error);
    }
}


function findEmptySlot(
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
  widgets: WidgetCard[],
  cardHeight: number,
  cardWidth: number,
): { row: number; col: number } | null {
  const occupiedCells = new Set<string>();

  patients.forEach(p => {
    if (p.gridRow > 0 && p.gridColumn > 0) occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
  });
  nurses.forEach(n => {
    for (let i = 0; i < 3; i++) occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
  });
   techs.forEach(t => {
    occupiedCells.add(`${t.gridRow}-${t.gridColumn}`);
  });
  widgets.forEach(w => {
    for (let r = 0; r < w.height; r++) {
      for (let c = 0; c < w.width; c++) occupiedCells.add(`${w.gridRow + r}-${w.gridColumn + c}`);
    }
  });

  for (let c = 1; c <= NUM_COLS_GRID - cardWidth + 1; c++) {
    for (let r = 1; r <= NUM_ROWS_GRID - cardHeight + 1; r++) {
      let isSlotAvailable = true;
      for (let h = 0; h < cardHeight; h++) {
        for (let w = 0; w < cardWidth; w++) {
          if (occupiedCells.has(`${r + h}-${c + w}`)) {
            isSlotAvailable = false;
            break;
          }
        }
        if (!isSlotAvailable) break;
      }
      if (isSlotAvailable) return { row: r, col: c };
    }
  }

  return null;
}


export function addStaffMember(
    formData: AddStaffMemberFormValues, 
    nurses: Nurse[], 
    techs: PatientCareTech[],
    patients: Patient[], 
    spectraPool: Spectra[],
    widgets: WidgetCard[]
): { newNurses?: Nurse[] | null; newTechs?: PatientCareTech[] | null; success?: boolean; error?: string } {
    const isNursingRole = ['Staff Nurse', 'Charge Nurse', 'Float Pool Nurse'].includes(formData.role);
    const isTechRole = formData.role === 'Patient Care Tech';

    if (!isNursingRole && !isTechRole) {
        console.log(`Added non-nursing/non-tech staff: ${formData.name} (${formData.role})`);
        return { success: true };
    }
    
    const allStaffSpectra = [...nurses.map(n => n.spectra), ...techs.map(t => t.spectra)];
    const assignedSpectra = spectraPool.find(s => s.inService && !allStaffSpectra.includes(s.id));

    if (!assignedSpectra) {
        return { error: "Could not add staff. Please add or enable a Spectra device in the pool." };
    }
    
    if (isNursingRole) {
        const position = findEmptySlot(patients, nurses, techs, widgets, 3, 1);
        if (!position) {
            return { error: "Cannot add new nurse, the grid is full." };
        }
        const newNurse: Nurse = {
            id: `nurse-${Date.now()}`,
            name: formData.name,
            role: formData.role,
            relief: formData.relief || undefined,
            spectra: assignedSpectra.id,
            assignedPatientIds: Array(6).fill(null),
            gridRow: position.row,
            gridColumn: position.col,
        };
        return { newNurses: [...nurses, newNurse] };
    }

    if (isTechRole) {
        const position = findEmptySlot(patients, nurses, techs, widgets, 1, 1);
         if (!position) {
            return { error: "Cannot add new tech, the grid is full." };
        }
        const newTech: PatientCareTech = {
            id: `tech-${Date.now()}`,
            name: formData.name,
            spectra: assignedSpectra.id,
            assignmentGroup: '',
            gridRow: position.row,
            gridColumn: position.col,
        };
        return { newTechs: [...techs, newTech] };
    }

    return { success: true };
}

export function calculateTechAssignments(techs: PatientCareTech[], patients: Patient[]): PatientCareTech[] {
    const activePatients = patients
        .filter(p => p.name !== 'Vacant' && !p.isBlocked)
        .sort((a, b) => {
            const numA = parseInt(a.roomDesignation.replace(/\D/g, ''), 10);
            const numB = parseInt(b.roomDesignation.replace(/\D/g, ''), 10);
            return numA - numB;
        });

    if (techs.length === 0 || activePatients.length === 0) {
        return techs.map(tech => ({ ...tech, assignmentGroup: 'N/A' }));
    }

    const patientsPerTech = Math.ceil(activePatients.length / techs.length);

    return techs.map((tech, index) => {
        const startIndex = index * patientsPerTech;
        const endIndex = Math.min(startIndex + patientsPerTech - 1, activePatients.length - 1);
        
        if (startIndex >= activePatients.length) {
            return { ...tech, assignmentGroup: 'N/A' };
        }

        const startRoom = activePatients[startIndex].roomDesignation;
        const endRoom = activePatients[endIndex].roomDesignation;

        const assignmentGroup = startRoom === endRoom ? startRoom : `${startRoom} - ${endRoom}`;

        return { ...tech, assignmentGroup };
    });
}
