
"use server";

import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import type { AssignmentSet, LayoutName, Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';

export async function saveShiftAssignments(
    layoutName: LayoutName, 
    nurses: Nurse[], 
    patients: Patient[],
    chargeNurseName: string,
): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();

    // Day shift from 2 AM (2) to 1:59 PM (13)
    // Night shift from 2 PM (14) to 1:59 AM (1)
    const shift = (currentHour >= 2 && currentHour < 14) ? 'Day Shift' : 'Night Shift';
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const shiftString = shift.split(' ')[0]; // Day or Night
    
    const assignmentId = `${layoutName.replace(/\s+/g, '-')}-${dateString}-${shiftString}`;
    
    const patientMap = new Map(patients.map(p => [p.id, p]));

    const assignmentSet: AssignmentSet = {
        id: assignmentId,
        layoutName,
        shift,
        date: now,
        chargeNurseName,
        assignments: nurses.map(nurse => ({
            nurseId: nurse.id,
            nurseName: nurse.name,
            spectra: nurse.spectra,
            assignedPatients: nurse.assignedPatientIds
                .filter((id): id is string => id !== null)
                .map(patientId => {
                    const patient = patientMap.get(patientId);
                    return {
                        patientId,
                        roomDesignation: patient?.roomDesignation || 'N/A',
                        patientName: patient?.name || 'Unknown',
                    };
                }),
        })),
    };

    // Convert dates to Timestamps for Firestore
    const dataToSave = {
        ...assignmentSet,
        date: Timestamp.fromDate(assignmentSet.date),
    };
    
    const assignmentDocRef = doc(db, 'assignments', assignmentId);

    try {
        await setDoc(assignmentDocRef, dataToSave);
    } catch (error) {
        console.error("Error saving shift assignments to Firestore:", error);
        throw new Error("Failed to save assignments to the database.");
    }
}
