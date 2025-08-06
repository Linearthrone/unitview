"use server";

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { LayoutName, Patient } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import { saveNurses, saveTechs } from './nurseService';
import { savePatients } from './patientService';
import { getPerimeterCells } from '@/lib/grid-utils';

const appConfigDocRef = doc(db, 'appState', 'config');
const userPrefsDocRef = doc(db, 'appState', 'userPreferences');

interface AppConfig {
    customLayoutNames?: LayoutName[];
}

async function getAppConfig(): Promise<AppConfig> {
    try {
        const docSnap = await getDoc(appConfigDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as AppConfig;
        }
        // If config doesn't exist, create it with a default layout
        const initialConfig: AppConfig = { customLayoutNames: ['North-South View'] };
        await setDoc(appConfigDocRef, initialConfig);
        return initialConfig;
    } catch (error) {
        console.error("Error fetching app config from Firestore:", error);
        return { customLayoutNames: ['North-South View'] }; // Fallback
    }
}

export async function getAvailableLayouts(): Promise<LayoutName[]> {
    const config = await getAppConfig();
    return Array.from(new Set(config.customLayoutNames || ['North-South View']));
}

export async function saveNewLayout(layoutName: string, patients: Patient[], nurses: Nurse[], techs: PatientCareTech[]): Promise<LayoutName[]> {
    // Save the actual layout data to their respective collections
    await savePatients(layoutName, patients);
    await saveNurses(layoutName, nurses);
    await saveTechs(layoutName, techs);

    // Update the list of custom layout names in the central config doc
    const config = await getAppConfig();
    const customLayoutNames = config.customLayoutNames || [];
    const updatedCustomLayouts = Array.from(new Set([...customLayoutNames, layoutName]));
    
    await setDoc(appConfigDocRef, { customLayoutNames: updatedCustomLayouts }, { merge: true });

    return updatedCustomLayouts;
}

export async function createNewUnitLayout(designation: string, numRooms: number): Promise<LayoutName[]> {
    const perimeterCells = getPerimeterCells();
    if (numRooms > perimeterCells.length) {
        throw new Error(`Cannot create ${numRooms} rooms. The grid supports a maximum of ${perimeterCells.length} perimeter rooms.`);
    }

    const newPatients: Patient[] = [];
    
    // Create room slots for the requested number of rooms
    for (let i = 0; i < numRooms; i++) {
        const { row, col } = perimeterCells[i];
        const roomNumber = (i + 1).toString().padStart(2, '0');
        const roomDesignation = `${designation}${roomNumber}`;
        
        newPatients.push({
            id: `room-${roomDesignation}-${Date.now()}-${i}`,
            bedNumber: i + 1,
            roomDesignation,
            name: 'Vacant',
            age: 0,
            admitDate: new Date(),
            dischargeDate: new Date(),
            chiefComplaint: '',
            ldas: [],
            diet: 'NPO (Nothing by mouth)',
            mobility: 'Bed Rest',
            codeStatus: 'Full Code',
            orientationStatus: 'x4',
            isFallRisk: false,
            isSeizureRisk: false,
            isAspirationRisk: false,
            isIsolation: false,
            isInRestraints: false,
            isComfortCareDNR: false,
            isBlocked: false,
            gridRow: row,
            gridColumn: col
        });
    }

    // Create default staff for the new unit
    const defaultNurses: Nurse[] = [
        {
            id: `nurse-charge-${Date.now()}`,
            name: 'Unassigned',
            role: 'Charge Nurse',
            assignedPatientIds: [],
            gridRow: 1,
            gridColumn: 1
        },
        {
            id: `nurse-clerk-${Date.now()}`,
            name: 'Unassigned',
            role: 'Unit Clerk',
            assignedPatientIds: [],
            gridRow: 1,
            gridColumn: 2
        }
    ];

    // Save the new layout
    const layoutName = designation;
    await saveNewLayout(layoutName, newPatients, defaultNurses, []);

    // Return updated list of layouts
    const config = await getAppConfig();
    return Array.from(new Set([...(config.customLayoutNames || []), layoutName]));
}

interface UserPreferences {
    lastSelectedLayout: LayoutName;
    isLayoutLocked: boolean;
}

export async function getUserPreferences(): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
        lastSelectedLayout: 'North-South View',
        isLayoutLocked: false,
    };
    try {
        const docSnap = await getDoc(userPrefsDocRef);
        if (docSnap.exists()) {
            return { ...defaultPrefs, ...docSnap.data() };
        }
        await setDoc(userPrefsDocRef, defaultPrefs);
        return defaultPrefs;
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        return defaultPrefs;
    }
}

export async function setUserPreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
): Promise<void> {
    try {
        await setDoc(userPrefsDocRef, { [key]: value }, { merge: true });
    } catch (error) {
        console.error(`Error setting user preference for ${key}:`, error);
    }
}
