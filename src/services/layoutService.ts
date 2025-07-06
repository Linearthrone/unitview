
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { layouts as appLayouts } from '@/lib/layouts';
import type { LayoutName, Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';
import { saveNurses } from './nurseService';
import { savePatients } from './patientService';

const appConfigDocRef = doc(db, 'appState', 'config');

interface AppConfig {
    customLayoutNames?: LayoutName[];
    lastSelectedLayout?: LayoutName;
}

async function getAppConfig(): Promise<AppConfig> {
    try {
        const docSnap = await getDoc(appConfigDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as AppConfig;
        }
        return {}; // Return empty object if not found
    } catch (error) {
        console.error("Error fetching app config from Firestore:", error);
        return {};
    }
}

export async function getAvailableLayouts(): Promise<LayoutName[]> {
    const config = await getAppConfig();
    const customLayoutNames = config.customLayoutNames || [];
    const allNames = [...Object.keys(appLayouts), ...customLayoutNames];
    return Array.from(new Set(allNames));
}

export async function saveNewLayout(layoutName: string, patients: Patient[], nurses: Nurse[]): Promise<LayoutName[]> {
    // Save the actual layout data to their respective collections
    await savePatients(layoutName, patients);
    await saveNurses(layoutName, nurses);

    // Update the list of custom layout names in the central config doc
    const config = await getAppConfig();
    const customLayoutNames = config.customLayoutNames || [];
    const updatedCustomLayouts = Array.from(new Set([...customLayoutNames, layoutName]));
    
    try {
        // Use set with merge to create or update the document
        await setDoc(appConfigDocRef, { customLayoutNames: updatedCustomLayouts }, { merge: true });
    } catch (error) {
        console.error("Error saving new layout name:", error);
    }

    return Array.from(new Set([...Object.keys(appLayouts), ...updatedCustomLayouts]));
}


export async function getLastSelectedLayout(): Promise<LayoutName | null> {
    const config = await getAppConfig();
    return config.lastSelectedLayout || null;
}

export async function setLastSelectedLayout(layoutName: LayoutName): Promise<void> {
    try {
        // Use set with merge to create or update the document
        await setDoc(appConfigDocRef, { lastSelectedLayout: layoutName }, { merge: true });
    } catch(error) {
        console.error("Error setting last selected layout:", error);
    }
}

export async function getUserLayoutLockState(): Promise<boolean> {
    // This value is needed synchronously on page load to prevent UI flickering and layout changes.
    // For this reason, we'll leave it in localStorage for instant access.
    // A full migration would require a global loading state for the app config.
    if (typeof window !== 'undefined') {
        return localStorage.getItem('userLayoutLockState') === 'true';
    }
    return false;
}

export function setUserLayoutLockState(isLocked: boolean): void {
    // Sticking with localStorage for synchronous access.
    if (typeof window !== 'undefined') {
        localStorage.setItem('userLayoutLockState', String(isLocked));
    }
}
