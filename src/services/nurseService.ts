
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, query } from 'firebase/firestore';
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { AddStaffMemberFormValues } from '@/types/forms';
import type { LayoutName } from '@/types/patient';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

const getNurseCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'nurses');
const getTechCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'techs');

export async function getNurses(layoutName: LayoutName): Promise<Nurse[]> {
    const collectionRef = getNurseCollectionRef(layoutName);
    try {
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map(doc => doc.data() as Nurse);

    } catch (error) {
        console.error(`Error fetching nurse layout ${layoutName} from Firestore:`, error);
        return [];
    }
}

export async function saveNurses(layoutName: LayoutName, nurses: Nurse[]): Promise<void> {
    const collectionRef = getNurseCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        const snapshot = await getDocs(collectionRef);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));

        nurses.forEach(nurse => {
            const docRef = doc(collectionRef, nurse.id);
            // Ensure no undefined fields are accidentally sent to Firestore
            const nurseDataForFirestore = {
                ...nurse,
                relief: nurse.relief || null, 
            };
            batch.set(docRef, nurseDataForFirestore);
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error saving nurse layout ${layoutName} to Firestore:`, error);
    }
}

export async function getTechs(layoutName: LayoutName): Promise<PatientCareTech[]> {
    const collectionRef = getTechCollectionRef(layoutName);
    try {
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map(doc => doc.data() as PatientCareTech);
    } catch (error) {
        console.error(`Error fetching techs for layout ${layoutName} from Firestore:`, error);
        return [];
    }
}

export async function saveTechs(layoutName: LayoutName, techs: PatientCareTech[]): Promise<void> {
    if (!techs) return;
    
    const collectionRef = getTechCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        const snapshot = await getDocs(collectionRef);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));

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
    spectraPool: Spectra[]
): { 
    newNurses?: Nurse[] | null; 
    newTechs?: PatientCareTech[] | null; 
    success?: boolean; 
    error?: string 
} {
    const { role } = formData;
    
    if (role === 'Sitter') {
        return { success: true }; // Sitters are tracked conceptually but don't have grid cards.
    }

    const isNurseRole = ['Staff Nurse', 'Float Pool Nurse', 'Charge Nurse', 'Unit Clerk'].includes(role);
    const isTechRole = role === 'Patient Care Tech';

    const allStaffSpectra = [...nurses.map(n => n.spectra), ...techs.map(t => t.spectra)];
    const assignedSpectra = spectraPool.find(s => s.inService && !allStaffSpectra.includes(s.id));

    if ((isNurseRole || isTechRole) && !assignedSpectra) {
        return { error: "Could not add staff. Please add or enable a Spectra device in the pool." };
    }
    
    if (isNurseRole) {
        const position = findEmptySlot(patients, nurses, techs, 3, 1);
        if (!position) {
            return { error: "Cannot add new staff member, the grid is full." };
        }
        const newNurse: Nurse = {
            id: `nurse-${Date.now()}`,
            name: formData.name,
            role: formData.role,
            relief: formData.relief || undefined,
            spectra: assignedSpectra!.id, // We've checked for this already
            assignedPatientIds: Array(6).fill(null),
            gridRow: position.row,
            gridColumn: position.col,
        };
        return { newNurses: [...nurses, newNurse] };
    }

    if (isTechRole) {
        const position = findEmptySlot(patients, nurses, techs, 1, 1);
         if (!position) {
            return { error: "Cannot add new tech, the grid is full." };
        }
        const newTech: PatientCareTech = {
            id: `tech-${Date.now()}`,
            name: formData.name,
            spectra: assignedSpectra!.id, // We've checked for this already
            assignmentGroup: '',
            gridRow: position.row,
            gridColumn: position.col,
        };
        return { newTechs: [...techs, newTech] };
    }

    // Should not be reached if all roles are handled
    return { error: `Unhandled role: ${role}` };
}

export async function calculateTechAssignments(techs: PatientCareTech[], patients: Patient[]): Promise<PatientCareTech[]> {
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
