
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';
import { generateInitialSpectra } from '@/lib/initial-spectra';

const spectraDocRef = doc(db, 'appState', 'spectraPool');

export async function getSpectraPool(): Promise<Spectra[]> {
    try {
        const docSnap = await getDoc(spectraDocRef);
        if (docSnap.exists()) {
            return docSnap.data().pool as Spectra[];
        } else {
            const initialSpectra = generateInitialSpectra();
            await saveSpectraPool(initialSpectra);
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
