import type { Nurse, Spectra } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { AddNurseFormValues } from '@/components/add-nurse-dialog';
import type { LayoutName } from '@/types/patient';
import { generateInitialNurses } from '@/lib/initial-nurses';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

const getStorageKey = (layoutName: LayoutName) => `nurseGridLayout_${layoutName}`;

export function getNurses(layoutName: LayoutName, spectraPool: Spectra[]): Nurse[] {
    const storageKey = getStorageKey(layoutName);
    try {
        const savedNurseLayoutJSON = localStorage.getItem(storageKey);
        if (savedNurseLayoutJSON) {
            const savedNurses = JSON.parse(savedNurseLayoutJSON) as Partial<Nurse>[];
            return savedNurses.map(nurse => ({
                id: nurse.id || `nurse-${Date.now()}`,
                name: nurse.name || 'Unnamed',
                relief: nurse.relief || '',
                spectra: nurse.spectra || 'N/A',
                gridRow: nurse.gridRow || 1,
                gridColumn: nurse.gridColumn || 1,
                assignedPatientIds: nurse.assignedPatientIds && Array.isArray(nurse.assignedPatientIds) 
                                    ? nurse.assignedPatientIds 
                                    : Array(6).fill(null),
            })) as Nurse[];
        } else {
            const initialNurses = generateInitialNurses();
            const availableSpectra = spectraPool.filter(s => s.inService);
            return initialNurses.map((nurse, index) => ({
                ...nurse,
                spectra: availableSpectra[index]?.id || 'N/A',
            })) as Nurse[];
        }
    } catch (error) {
        console.error(`Error processing nurse layout ${layoutName} from localStorage:`, error);
        const initialNurses = generateInitialNurses();
        const availableSpectra = spectraPool.filter(s => s.inService);
        return initialNurses.map((nurse, index) => ({
            ...nurse,
            spectra: availableSpectra[index]?.id || 'N/A',
        })) as Nurse[];
    }
}

export function saveNurses(layoutName: LayoutName, nurses: Nurse[]): void {
    const storageKey = getStorageKey(layoutName);
    try {
        localStorage.setItem(storageKey, JSON.stringify(nurses));
    } catch (error) {
        console.error(`Error saving nurse layout ${layoutName}:`, error);
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
