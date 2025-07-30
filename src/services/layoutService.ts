
"use server";

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import type { LayoutName, Patient, StaffAssignments, UserPreferences, WidgetCard } from '@/types/patient';
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
        const initialConfig: AppConfig = { customLayoutNames: ['North/South View'] };
        await setDoc(appConfigDocRef, initialConfig);
        return initialConfig;
    } catch (error) {
        console.error("Error fetching app config from Firestore:", error);
        return { customLayoutNames: ['North/South View'] }; // Fallback
    }
}

export async function getAvailableLayouts(): Promise<LayoutName[]> {
    const config = await getAppConfig();
    return Array.from(new Set(config.customLayoutNames || []));
}

export async function saveNewLayout(layoutName: string, patients: Patient[], nurses: Nurse[], techs: PatientCareTech[], widgets: WidgetCard[], staffData: StaffAssignments): Promise<LayoutName[]> {
    // Save the actual layout data to their respective collections
    await savePatients(layoutName, patients);
    await saveNurses(layoutName, nurses);
    await saveTechs(layoutName, techs);
    await saveWidgets(layoutName, widgets);
    await saveStaff(layoutName, staffData);

    // Update the list of custom layout names in the central config doc
    const config = await getAppConfig();
    const customLayoutNames = config.customLayoutNames || [];
    const updatedCustomLayouts = Array.from(new Set([...customLayoutNames, layoutName]));
    
    try {
        // Use set with merge to create or update the document
        await setDoc(appConfigDocRef, { customLayoutNames: updatedCustomLayouts }, { merge: true });
        await setUserPreference('lastSelectedLayout', layoutName);
    } catch (error) {
        console.error("Error saving new layout name:", error);
    }

    return updatedCustomLayouts;
}


export async function createNewUnitLayout(designation: string, numRooms: number): Promise<LayoutName[]> {
    const perimeterCells = getPerimeterCells();
    if (numRooms > perimeterCells.length) {
        throw new Error(`Cannot create ${numRooms} rooms. The grid supports a maximum of ${perimeterCells.length} perimeter rooms.`);
    }

    const newPatients: Patient[] = [];
    for (let i = 0; i < numRooms; i++) {
        const cell = perimeterCells[i];
        
        const newRoom: Patient = {
            id: `room-${designation.replace(/[\/\s]+/g, '-')}-${i}-${Math.random().toString(36).slice(2, 9)}`,
            bedNumber: i + 1,
            roomDesignation: `${designation}-${String(i + 1).padStart(2, '0')}`,
            name: 'Vacant',
            age: 0,
            admitDate: new Date(),
            dischargeDate: new Date(),
            chiefComplaint: 'N/A',
            ldas: [],
            diet: 'N/A',
            mobility: 'Independent',
            codeStatus: 'Full Code',
            orientationStatus: 'N/A',
            isFallRisk: false,
            isSeizureRisk: false,
            isAspirationRisk: false,
            isIsolation: false,
            isInRestraints: false,
            isComfortCareDNR: false,
            gridRow: cell.row,
            gridColumn: cell.col,
        };
        newPatients.push(newRoom);
    }
    
    const newNurses: Nurse[] = [];
    const newTechs: PatientCareTech[] = [];
    const layoutName = designation;
    await savePatients(layoutName, newPatients);
    await saveNurses(layoutName, newNurses);
    await saveTechs(layoutName, newTechs);

    const config = await getAppConfig();
    const customLayoutNames = config.customLayoutNames || [];
    const updatedCustomLayouts = Array.from(new Set([...customLayoutNames, layoutName]));
    
    await setDoc(appConfigDocRef, { customLayoutNames: updatedCustomLayouts }, { merge: true });

    return updatedCustomLayouts;
}

export async function getWidgets(layoutName: string): Promise<WidgetCard[] | null> {
    const widgetsDocRef = doc(db, 'layouts', layoutName, 'widgets', 'positions');
    try {
        const docSnap = await getDoc(widgetsDocRef);
        if (docSnap.exists()) {
            return docSnap.data().widgets as WidgetCard[];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching widgets for layout ${layoutName}:`, error);
        return null;
    }
}

export async function saveWidgets(layoutName: string, widgets: WidgetCard[]): Promise<void> {
    const widgetsDocRef = doc(db, 'layouts', layoutName, 'widgets', 'positions');
    try {
        await setDoc(widgetsDocRef, { widgets });
    } catch (error) {
        console.error(`Error saving widgets for layout ${layoutName}:`, error);
    }
}

export async function getStaff(layoutName: string): Promise<StaffAssignments | null> {
    const staffDocRef = doc(db, 'layouts', layoutName, 'staff', 'assignments');
    try {
        const docSnap = await getDoc(staffDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as StaffAssignments;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching staff for layout ${layoutName}:`, error);
        return null;
    }
}

export async function saveStaff(layoutName: string, staff: StaffAssignments): Promise<void> {
    const staffDocRef = doc(db, 'layouts', layoutName, 'staff', 'assignments');
    try {
        await setDoc(staffDocRef, staff);
    } catch (error) {
        console.error(`Error saving staff for layout ${layoutName}:`, error);
    }
}


export async function getUserPreferences(): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
        lastSelectedLayout: 'North/South View',
        isLayoutLocked: false,
    };
    try {
        const docSnap = await getDoc(userPrefsDocRef);
        if (docSnap.exists()) {
            return { ...defaultPrefs, ...docSnap.data() };
        }
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
