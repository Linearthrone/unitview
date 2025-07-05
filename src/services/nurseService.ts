import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import type { Nurse, Spectra } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { AddNurseFormValues } from '@/components/add-nurse-dialog';
import type { LayoutName } from '@/types/patient';
import { generateInitialNurses } from '@/lib/initial-nurses';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

const getCollectionRef = (layoutName: LayoutName) => collection(db, 'layouts', layoutName, 'nurses');

export async function getNurses(layoutName: LayoutName, spectraPool: Spectra[]): Promise<Nurse[]> {
    const collectionRef = getCollectionRef(layoutName);
    try {
        const snapshot = await getDocs(collectionRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => doc.data() as Nurse);
        }

        console.log(`No nurse data for layout '${layoutName}' in Firestore. Generating initial nurses.`);
        const initialNurses = generateInitialNurses();
        const availableSpectra = spectraPool.filter(s => s.inService);
        const nursesWithSpectra = initialNurses.map((nurse, index) => ({
            ...nurse,
            spectra: availableSpectra[index]?.id || 'N/A',
        })) as Nurse[];
        
        await saveNurses(layoutName, nursesWithSpectra);
        return nursesWithSpectra;

    } catch (error) {
        console.error(`Error fetching nurse layout ${layoutName} from Firestore:`, error);
        // Fallback to in-memory generation on error
        const initialNurses = generateInitialNurses();
        const availableSpectra = spectraPool.filter(s => s.inService);
        return initialNurses.map((nurse, index) => ({
            ...nurse,
            spectra: availableSpectra[index]?.id || 'N/A',
        })) as Nurse[];
    }
}

export async function saveNurses(layoutName: LayoutName, nurses: Nurse[]): Promise<void> {
    const collectionRef = getCollectionRef(layoutName);
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

export function addNurse(
    formData: AddNurseFormValues, 
    nurses: Nurse[], 
    patients: Patient[], 
    spectraPool: Spectra[]
): { newNurses: Nurse[] | null; error?: string } {
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
        relief: formData.relief,
        spectra: assignedSpectra.id,
        assignedPatientIds: Array(6).fill(null),
        gridRow: position.row,
        gridColumn: position.col,
    };
    
    return { newNurses: [...nurses, newNurse] };
}
