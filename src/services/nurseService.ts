
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, query } from 'firebase/firestore';
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { AddStaffMemberFormValues } from '@/types/forms';
import type { LayoutName } from '@/types/patient';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';
import { findCompactEmptySlot, getAvailableSpectra } from './nurseHelpers';

const getNurseCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'nurses');
const getTechCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'techs');

export async function getNurses(layoutName: LayoutName): Promise<Nurse[]> {
    if (!layoutName) return [];
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
    if (!layoutName || !nurses) return;
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
    if (!layoutName) return [];
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
    if (!layoutName || !techs) return;
    
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
    const availableSpectraList = getAvailableSpectra(spectraPool, nurses, techs);
    if ((isNurseRole || isTechRole) && availableSpectraList.length === 0) {
        return { error: "No available Spectra devices. Please add or enable a Spectra device in the pool before adding staff." };
    }
    const position = findCompactEmptySlot(patients, nurses, techs, isNurseRole ? 3 : 1, 1);
    if (!position) {
        return { error: "Cannot add new staff member, the grid is full or fragmented. Try moving staff to free up space." };
    }
    if (isNurseRole) {
        const newNurse: Nurse = {
            id: `nurse-${Date.now()}`,
            name: formData.name,
            role: formData.role,
            relief: formData.relief || undefined,
            spectra: availableSpectraList[0].id,
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
            spectra: availableSpectraList[0].id,
            assignmentGroup: '',
            gridRow: position.row,
            gridColumn: position.col,
        };
        return { newTechs: [...techs, newTech] };
    }
    return { error: `Unhandled role: ${role}` };
}

export async function calculateTechAssignments(
    techs: PatientCareTech[],
    patients: Patient[]
): Promise<PatientCareTech[]> {
    if (techs.length === 0) return [];

    const patientsWithNurse = patients.filter(p => p.assignedNurse);
    if (patientsWithNurse.length === 0) {
        return techs.map(tech => ({ ...tech, assignmentGroup: "All Patients" }));
    }

    const patientsPerTech = Math.ceil(patientsWithNurse.length / techs.length);
    const assignments: { [key: string]: string[] } = {}; // techId -> patientIds
    const assignedPatientIds = new Set<string>();
    
    techs.forEach(tech => assignments[tech.id] = []);

    let currentTechIndex = 0;
    for (const patient of patientsWithNurse) {
        if (assignedPatientIds.has(patient.id)) continue;

        assignments[techs[currentTechIndex].id].push(patient.id);
        assignedPatientIds.add(patient.id);

        currentTechIndex = (currentTechIndex + 1) % techs.length;
    }

    const patientMap = new Map(patients.map(p => [p.id, p]));
    const nurseToPatients = new Map<string, string[]>();

    patientsWithNurse.forEach(p => {
        if (p.assignedNurse) {
            if (!nurseToPatients.has(p.assignedNurse)) {
                nurseToPatients.set(p.assignedNurse, []);
            }
            nurseToPatients.get(p.assignedNurse)!.push(p.roomDesignation);
        }
    });

    return techs.map(tech => {
        const assignedNurses = new Set<string>();
        const myPatientIds = assignments[tech.id];

        myPatientIds.forEach(patientId => {
            const patient = patientMap.get(patientId);
            if (patient && patient.assignedNurse) {
                assignedNurses.add(patient.assignedNurse);
            }
        });

        const nurseNames = Array.from(assignedNurses).sort();
        const assignmentGroup = nurseNames.length > 0 ? `Nurses: ${nurseNames.join(', ')}` : 'Unassigned';

        return { ...tech, assignmentGroup };
    });
}
