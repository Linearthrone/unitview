
"use server";

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { LayoutName, Patient, StaffAssignments, UserPreferences, WidgetCard } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import { saveNurses, saveTechs } from './nurseService';
import { savePatients } from './patientService';

const userPrefsDocRef = doc(db, 'appState', 'userPreferences');


export async function saveLayout(layoutName: string, patients: Patient[], nurses: Nurse[], techs: PatientCareTech[], widgets: WidgetCard[], staffData: StaffAssignments): Promise<void> {
    await savePatients(layoutName, patients);
    await saveNurses(layoutName, nurses);
    await saveTechs(layoutName, techs);
    await saveWidgets(layoutName, widgets);
    await saveStaff(layoutName, staffData);
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
