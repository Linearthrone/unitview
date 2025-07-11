
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';
import { generateInitialSpectra } from '@/lib/initial-spectra';

const spectraDocRef = doc(db, 'appState', 'spectraPool');

export async function getSpectraPool(): Promise<Spectra[]> {
    try {
        const docSnap = await getDoc(spectraDocRef);
        if (docSnap.exists()) {
            // The data is stored under a 'pool' key in the document
            return docSnap.data().pool as Spectra[];
        } else {
            // Document doesn't exist, return initial data without writing.
            // It will be saved when the user first modifies it.
            const initialSpectra = generateInitialSpectra();
            return initialSpectra;
        }
    } catch (error) {
        console.error("Failed to load spectra pool from Firestore:", error);
        return generateInitialSpectra();
    }
}

export async function saveSpectraPool(pool: Spectra[]): Promise<void> {
    try {
        await setDoc(spectraDocRef, { pool });
    } catch (error) {
        console.error("Failed to save spectra pool to Firestore:", error);
    }
}

export async function addSpectra(newId: string, pool: Spectra[]): Promise<{ newPool: Spectra[] | null; error?: string }> {
    const trimmedId = newId.trim().toUpperCase();
    if (!trimmedId) {
        return { newPool: null, error: "Spectra ID cannot be empty." };
    }
    if (pool.some(s => s.id.toUpperCase() === trimmedId)) {
        return { newPool: null, error: "This Spectra ID already exists in the pool." };
    }
    const newPool = [...pool, { id: trimmedId, inService: true }];
    await saveSpectraPool(newPool);
    return { newPool };
}

export async function toggleSpectraStatus(id: string, inService: boolean, pool: Spectra[], nurses: Nurse[], techs: PatientCareTech[]): Promise<{ newPool: Spectra[] | null; error?: string }> {
    if (!inService) {
        const isAssignedToNurse = nurses.some(n => n.spectra === id);
        const isAssignedToTech = techs.some(t => t.spectra === id);
        if (isAssignedToNurse || isAssignedToTech) {
            return { newPool: null, error: "This Spectra is currently assigned to a staff member." };
        }
    }
    const newPool = pool.map(s => s.id === id ? { ...s, inService } : s);
    await saveSpectraPool(newPool);
    return { newPool };
}
