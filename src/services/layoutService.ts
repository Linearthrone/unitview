
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import type { LayoutName, Patient, StaffAssignments, UserPreferences, WidgetCard } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import { getNurses, saveNurses, getTechs, saveTechs, seedInitialNurses, seedInitialTechs } from './nurseService';
import { getPatients, savePatients } from './patientService';
import { getPerimeterCells, NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

const userPrefsDocRef = doc(db, 'appState', 'userPreferences');

export async function getAvailableLayouts(): Promise<LayoutName[]> {
    const layoutsCollectionRef = collection(db, 'layouts');
    try {
        const snapshot = await getDocs(layoutsCollectionRef);
        if (snapshot.empty) {
            // If there are no layouts, create the default "Unit" one.
            const defaultLayoutName = 'Unit';
            // Explicitly create the layout document itself before seeding subcollections.
            const layoutDocRef = doc(db, 'layouts', defaultLayoutName);
            await setDoc(layoutDocRef, { name: defaultLayoutName, createdAt: new Date() });
            // The getOrCreateLayout will handle seeding the rest of the data.
            await getOrCreateLayout(defaultLayoutName); 
            return [defaultLayoutName];
        }
        return snapshot.docs.map(doc => doc.id as LayoutName);
    } catch (error) {
        console.error("Error fetching available layouts:", error);
        // Fallback to ensure a default is always available, even on error.
        const defaultLayoutName = 'Unit';
        await getOrCreateLayout(defaultLayoutName).catch(console.error);
        return [defaultLayoutName];
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
    await Promise.all([
      savePatients(layoutName, patients),
      saveNurses(layoutName, nurses),
      saveTechs(layoutName, techs),
      saveWidgets(layoutName, widgets),
      saveStaff(layoutName, staffData)
    ]);
}

export async function createNewUnitLayout(
  designation: string,
  roomCount: number,
  startNumber: number
): Promise<void> {
    const perimeterCells = getPerimeterCells();
    if (roomCount > perimeterCells.length) {
        throw new Error(`Cannot create a layout with ${roomCount} rooms. The maximum is ${perimeterCells.length}.`);
    }

    const newPatients: Patient[] = [];
    for (let i = 0; i < roomCount; i++) {
        const cell = perimeterCells[i];
        const roomNumber = startNumber + i;
        const patient: Patient = {
            id: `patient-${designation.replace(/\s+/g, '-')}-${roomNumber}`,
            bedNumber: roomNumber,
            roomDesignation: `${roomNumber}`,
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
        newPatients.push(patient);
    }
    
    // Create the layout document first to ensure it exists before we save to its subcollections
    const layoutDocRef = doc(db, 'layouts', designation);
    await setDoc(layoutDocRef, { name: designation, createdAt: new Date() });

    // Now seed default staff and widgets for the new layout
    const newNurses = await seedInitialNurses(designation);
    const newTechs = await seedInitialTechs(designation);
    const newWidgets: WidgetCard[] = [
        { id: 'unit-clerk', type: 'UnitClerk', gridRow: 2, gridColumn: 9, width: 2, height: 1 },
        { id: 'charge-nurse', type: 'ChargeNurse', gridRow: 4, gridColumn: 9, width: 2, height: 1 },
    ];
    const newStaff: StaffAssignments = { chargeNurseName: 'Unassigned', unitClerkName: 'Unassigned' };

    // Save all the new data to the now-existing layout
    await saveLayout(designation, newPatients, newNurses, newTechs, newWidgets, newStaff);
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
