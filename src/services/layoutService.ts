import { layouts as appLayouts } from '@/lib/layouts';
import type { LayoutName, Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';
import { saveNurses } from './nurseService';
import { savePatients } from './patientService';

const CUSTOM_LAYOUT_NAMES_KEY = 'customLayoutNames';
const LAST_LAYOUT_KEY = 'lastSelectedLayoutName';

export function getAvailableLayouts(): LayoutName[] {
    try {
        const customLayoutNames = JSON.parse(localStorage.getItem(CUSTOM_LAYOUT_NAMES_KEY) || '[]') as string[];
        const allNames = [...Object.keys(appLayouts), ...customLayoutNames];
        return Array.from(new Set(allNames));
    } catch (error) {
        console.error("Failed to load custom layouts:", error);
        return Object.keys(appLayouts) as LayoutName[];
    }
}

export function saveNewLayout(layoutName: string, patients: Patient[], nurses: Nurse[]): LayoutName[] {
    savePatients(layoutName, patients);
    saveNurses(layoutName, nurses);

    const customLayoutNames = JSON.parse(localStorage.getItem(CUSTOM_LAYOUT_NAMES_KEY) || '[]') as string[];
    const updatedCustomLayouts = Array.from(new Set([...customLayoutNames, layoutName]));
    localStorage.setItem(CUSTOM_LAYOUT_NAMES_KEY, JSON.stringify(updatedCustomLayouts));
    
    return Array.from(new Set([...Object.keys(appLayouts), ...updatedCustomLayouts]));
}


export function getLastSelectedLayout(): LayoutName | null {
    return localStorage.getItem(LAST_LAYOUT_KEY) as LayoutName | null;
}

export function setLastSelectedLayout(layoutName: LayoutName): void {
    localStorage.setItem(LAST_LAYOUT_KEY, layoutName);
}

export function getUserLayoutLockState(): boolean {
    return localStorage.getItem('userLayoutLockState') === 'true';
}

export function setUserLayoutLockState(isLocked: boolean): void {
    localStorage.setItem('userLayoutLockState', String(isLocked));
}
