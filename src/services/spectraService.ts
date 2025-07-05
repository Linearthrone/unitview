import type { Nurse, Spectra } from '@/types/nurse';
import { generateInitialSpectra } from '@/lib/initial-spectra';

const SPECTRA_POOL_KEY = 'spectraPool';

export function getSpectraPool(): Spectra[] {
    try {
        const savedSpectra = localStorage.getItem(SPECTRA_POOL_KEY);
        if (savedSpectra) {
            return JSON.parse(savedSpectra);
        } else {
            const initialSpectra = generateInitialSpectra();
            saveSpectraPool(initialSpectra);
            return initialSpectra;
        }
    } catch (error) {
        console.error("Failed to load spectra pool:", error);
        return generateInitialSpectra();
    }
}

export function saveSpectraPool(pool: Spectra[]): void {
    localStorage.setItem(SPECTRA_POOL_KEY, JSON.stringify(pool));
}

export function addSpectra(newId: string, pool: Spectra[]): { newPool: Spectra[] | null; error?: string } {
    const trimmedId = newId.trim().toUpperCase();
    if (!trimmedId) {
        return { newPool: null, error: "Spectra ID cannot be empty." };
    }
    if (pool.some(s => s.id.toUpperCase() === trimmedId)) {
        return { newPool: null, error: "This Spectra ID already exists in the pool." };
    }
    const newPool = [...pool, { id: trimmedId, inService: true }];
    saveSpectraPool(newPool);
    return { newPool };
}

export function toggleSpectraStatus(id: string, inService: boolean, pool: Spectra[], nurses: Nurse[]): { newPool: Spectra[] | null; error?: string } {
    if (!inService && nurses.some(n => n.spectra === id)) {
        return { newPool: null, error: "This Spectra is currently assigned to a nurse." };
    }
    const newPool = pool.map(s => s.id === id ? { ...s, inService } : s);
    saveSpectraPool(newPool);
    return { newPool };
}
