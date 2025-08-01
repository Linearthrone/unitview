
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import type { LayoutName, Patient, StaffAssignments, UserPreferences, WidgetCard } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import { getNurses, saveNurses, getTechs, saveTechs } from './nurseService';
import { getPatients, savePatients } from './patientService';

const userPrefsDocRef = doc(db, 'appState', 'userPreferences');

export async function getAvailableLayouts(): Promise<LayoutName[]> {
    const layoutsCollectionRef = collection(db, 'layouts');
    try {
        const snapshot = await getDocs(layoutsCollectionRef);
        if (snapshot.empty) {
            return ['Unit']; // Return a default if no layouts exist
        }
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error("Error fetching available layouts:", error);
        return ['Unit']; // Fallback to default
    }
}


export async function getOrCreateLayout(layoutName: LayoutName) {
    const patients = await getPatients(layoutName);
    const nurses = await getNurses(layoutName);
    const techs = await getTechs(layoutName);
    const widgets = await getWidgets(layoutName);
    const staff = await getStaff(layoutName);

    return { patients, nurses, techs, widgets, staff };
}

export async function saveLayout(layoutName: string, patients: Patient[], nurses: Nurse[], techs: PatientCareTech[], widgets: WidgetCard[], staffData: StaffAssignments): Promise<void> {
    await savePatients(layoutName, patients);
    await saveNurses(layoutName, nurses);
    await saveTechs(layoutName, techs);
    await saveWidgets(layoutName, widgets);
    await saveStaff(layoutName, staffData);
}

export async function getWidgets(layoutName: string): Promise<WidgetCard[]> {
    const widgetsDocRef = doc(db, 'layouts', layoutName, 'widgets', 'positions');
    try {
        const docSnap = await getDoc(widgetsDocRef);
        if (docSnap.exists()) {
            return docSnap.data().widgets as WidgetCard[];
        }
        console.log(`No widgets found for layout '${layoutName}'. Seeding initial widgets.`);
        const initialWidgets: WidgetCard[] = [
            { id: 'unit-clerk', type: 'UnitClerk', gridRow: 2, gridColumn: 9, width: 2, height: 1 },
            { id: 'charge-nurse', type: 'ChargeNurse', gridRow: 4, gridColumn: 9, width: 2, height: 1 },
        ];
        await saveWidgets(layoutName, initialWidgets);
        return initialWidgets;

    } catch (error) {
        console.error(`Error fetching widgets for layout ${layoutName}:`, error);
        return [];
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

export async function getStaff(layoutName: string): Promise<StaffAssignments> {
    const staffDocRef = doc(db, 'layouts', layoutName, 'staff', 'assignments');
    try {
        const docSnap = await getDoc(staffDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as StaffAssignments;
        }
        console.log(`No staff found for layout '${layoutName}'. Seeding initial staff.`);
        const initialStaff: StaffAssignments = { chargeNurseName: 'Unassigned', unitClerkName: 'Unassigned' };
        await saveStaff(layoutName, initialStaff);
        return initialStaff;
    } catch (error) {
        console.error(`Error fetching staff for layout ${layoutName}:`, error);
        return { chargeNurseName: 'Unassigned', unitClerkName: 'Unassigned' };
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
        lastOpenedLayout: null,
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
