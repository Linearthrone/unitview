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
        // Validate each nurse object to ensure assignedPatientIds is an array.
        const nurses = snapshot.docs.map(doc => {
            const data = doc.data() as Nurse;
            if (!Array.isArray(data.assignedPatientIds)) {
                // If the field is missing or not an array, default it to the correct structure.
                data.assignedPatientIds = Array(6).fill(null);
            }
            return data;
        });

        // Ensure Charge Nurse and Unit Clerk exist
        const requiredRoles = ['Charge Nurse', 'Unit Clerk'];
        requiredRoles.forEach(role => {
            if (!nurses.some(n => n.role === role)) {
                nurses.push({
                    id: `nurse-${role.toLowerCase().replace(' ', '-')}-${Date.now()}`,
                    name: 'Unassigned',
                    role: role as any,
                    assignedPatientIds: [],
                    gridRow: 1, // Default position, can be moved by user
                    gridColumn: role === 'Charge Nurse' ? 1 : 2, // Default position
                });
            }
        });

        return nurses;

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
                spectra: nurse.spectra || null,
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
    const height = n.role === 'Staff Nurse' ? 3 : 1;
    for (let i = 0; i < height; i++) occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
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

// Utility to get available Spectra devices
export async function getAvailableSpectra(spectraPool: Spectra[], nurses: Nurse[], techs: PatientCareTech[]): Promise<Spectra[]> {
    const assignedSpectraIds = new Set([
        ...nurses.map(n => n.spectra),
        ...techs.map(t => t.spectra)
    ]);
    return spectraPool.filter(s => s.inService && !assignedSpectraIds.has(s.id));
}

// Improved error handling in addStaffMember
export async function addStaffMember(
    formData: AddStaffMemberFormValues, 
    nurses: Nurse[], 
    techs: PatientCareTech[],
    patients: Patient[], 
    spectraPool: Spectra[]
): Promise<{ 
    newNurses?: Nurse[] | null; 
    newTechs?: PatientCareTech[] | null; 
    success?: boolean; 
    error?: string 
}> {
    const { role } = formData;
    if (role === 'Sitter') {
        return { success: true };
    }
    const isNurseRole = ['Staff Nurse', 'Float Pool Nurse'].includes(role);
    const isTechRole = role === 'Patient Care Tech';
    if (role === 'Charge Nurse' || role === 'Unit Clerk') {
        const newNurses = nurses.map(n => n.role === role ? { ...n, name: formData.name } : n);
        return { newNurses };
    }
    const availableSpectra = await getAvailableSpectra(spectraPool, nurses, techs);
    if ((isNurseRole || isTechRole) && availableSpectra.length === 0) {
        return { error: "No available Spectra devices. Please add or enable a Spectra device in the pool before adding staff." };
    }
    // Use compact grid placement
    const position = await findCompactEmptySlot(patients, nurses, techs, isNurseRole ? 3 : 1, 1);
    if (!position) {
        return { error: "Cannot add new staff member, the grid is full or fragmented. Try moving staff to free up space." };
    }
    if (isNurseRole) {
        const newNurse: Nurse = {
            id: `nurse-${Date.now()}`,
            name: formData.name,
            role: formData.role as StaffRole,
            relief: formData.relief || undefined,
            spectra: availableSpectra[0].id,
            assignedPatientIds: Array(6).fill(null),
            gridRow: position.row,
            gridColumn: position.col,
        };
        return { newNurses: [...nurses, newNurse] };
    }
    if (isTechRole) {
        const newTech: PatientCareTech = {
            id: `tech-${Date.now()}`,
            name: formData.name,
            spectra: availableSpectra[0].id,
            assignmentGroup: '',
            gridRow: position.row,
            gridColumn: position.col,
        };
        return { newTechs: [...techs, newTech] };
    }
    return { error: `Unhandled role: ${role}` };
}

// Smarter grid placement: compact staff cards
export async function findCompactEmptySlot(
    patients: Patient[],
    nurses: Nurse[],
    techs: PatientCareTech[],
    cardHeight: number,
    cardWidth: number
): Promise<{ row: number; col: number } | null> {
    const occupiedCells = new Set<string>();
    patients.forEach(p => {
        if (p.gridRow > 0 && p.gridColumn > 0) occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
    });
    nurses.forEach(n => {
        const height = n.role === 'Staff Nurse' ? 3 : 1;
        for (let i = 0; i < height; i++) occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
    });
    techs.forEach(t => {
        occupiedCells.add(`${t.gridRow}-${t.gridColumn}`);
    });
    // Try to fill from top-left, compacting as much as possible
    for (let r = 1; r <= NUM_ROWS_GRID - cardHeight + 1; r++) {
        for (let c = 1; c <= NUM_COLS_GRID - cardWidth + 1; c++) {
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

// Automatic nurse assignment balancing
export async function balanceNurseAssignments(nurses: Nurse[], patients: Patient[]): Promise<Nurse[]> {
    const activePatients = patients.filter(p => p.name !== 'Vacant' && !p.isBlocked);
    const staffNurses = nurses.filter(n => n.role === 'Staff Nurse' || n.role === 'Float Pool Nurse');
    if (staffNurses.length === 0 || activePatients.length === 0) return nurses;
    const patientsPerNurse = Math.ceil(activePatients.length / staffNurses.length);
    let patientIndex = 0;
    const updatedNurses = nurses.map(nurse => {
        if (nurse.role === 'Staff Nurse' || nurse.role === 'Float Pool Nurse') {
            const assigned = [];
            for (let i = 0; i < patientsPerNurse && patientIndex < activePatients.length; i++, patientIndex++) {
                assigned.push(activePatients[patientIndex].id);
            }
            return { ...nurse, assignedPatientIds: assigned };
        }
        return nurse;
    });
    return updatedNurses;
}
