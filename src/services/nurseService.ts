
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import type { Nurse, Spectra } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { AddStaffMemberFormValues } from '@/types/forms';
import type { LayoutName } from '@/types/patient';
import { generateInitialNurses } from '@/lib/initial-nurses';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';
import { layouts as appLayouts } from '@/lib/layouts';

const getCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'nurses');

export async function getNurses(layoutName: LayoutName, spectraPool: Spectra[]): Promise<Nurse[]> {
    const collectionRef = getCollectionRef(layoutName);
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
        
        // Removed the slow initial write operation. Data will be saved on first user change.
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
        // You could potentially clear the collection here if needed, or just do nothing.
        // For now, we'll just prevent writing an empty array.
        return;
    }
    const collectionRef = getCollectionRef(layoutName);
    const batch = writeBatch(db);
    try {
        nurses.forEach(nurse => {
            const docRef = doc(collectionRef, nurse.id);
            // Undefined fields are handled by the initializeFirestore setting.
            batch.set(docRef, nurse);
        });
        await batch.commit();
    } catch (error) {
        console.error(`Error saving nurse layout ${layoutName} to Firestore:`, error);
    }
}

function findEmptySlotForNurse(patients: Patient[], nurses: Nurse[]): { row: number; col: number } | null {
    const occupiedCells = new Set<string>();
    patients.forEach(p => {
        occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
    });
    nurses.forEach(n => {
        for (let i = 0; i < 3; i++) {
            occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
        }
    });

    for (let c = 1; c <= NUM_COLS_GRID; c++) {
      for (let r = 1; r <= NUM_ROWS_GRID - 2; r++) {
        if (
          !occupiedCells.has(`${r}-${c}`) &&
          !occupiedCells.has(`${r + 1}-${c}`) &&
          !occupiedCells.has(`${r + 2}-${c}`)
        ) {
          return { row: r, col: c };
        }
      }
    }
    return null;
}

export function addStaffMember(
    formData: AddStaffMemberFormValues, 
    nurses: Nurse[], 
    patients: Patient[], 
    spectraPool: Spectra[]
): { newNurses?: Nurse[] | null; success?: boolean; error?: string } {
    const isNursingRole = ['Staff Nurse', 'Charge Nurse', 'Float Pool Nurse'].includes(formData.role);

    if (!isNursingRole) {
        // For non-nursing roles, we just acknowledge the addition for now.
        // In a real scenario, you might add them to a different list or database collection.
        console.log(`Added non-nursing staff: ${formData.name} (${formData.role})`);
        return { success: true };
    }

    const assignedSpectra = spectraPool.find(s => s.inService && !nurses.some(n => n.spectra === s.id));
    if (!assignedSpectra) {
        return { newNurses: null, error: "No Spectra Available" };
    }
    
    const position = findEmptySlotForNurse(patients, nurses);
    if (!position) {
        return { newNurses: null, error: "No Space Available" };
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
