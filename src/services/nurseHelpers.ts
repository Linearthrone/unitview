
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

// Utility to get available Spectra devices
export function getAvailableSpectra(spectraPool: Spectra[], nurses: Nurse[], techs: PatientCareTech[]): Spectra[] {
    const assignedSpectraIds = new Set([
        ...nurses.map(n => n.spectra),
        ...techs.map(t => t.spectra)
    ].filter(Boolean)); // Filter out undefined/null values
    return spectraPool.filter(s => s.inService && !assignedSpectraIds.has(s.id));
}

// Smarter grid placement that tries to compact staff cards together
export function findCompactEmptySlot(
    patients: Patient[],
    nurses: Nurse[],
    techs: PatientCareTech[],
    cardHeight: number,
    cardWidth: number
): { row: number; col: number } | null {
    const occupiedCells = new Set<string>();
    const staffCells = new Set<string>();

    // Mark occupied cells
    patients.forEach(p => {
        if (p.gridRow > 0 && p.gridColumn > 0) {
            occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
        }
    });

    // Track staff positions separately
    nurses.forEach(n => {
        const height = n.role === 'Staff Nurse' ? 3 : 1;
        for (let i = 0; i < height; i++) {
            occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
            staffCells.add(`${n.gridRow + i}-${n.gridColumn}`);
        }
    });

    techs.forEach(t => {
        occupiedCells.add(`${t.gridRow}-${t.gridColumn}`);
        staffCells.add(`${t.gridRow}-${t.gridColumn}`);
    });

    // First try to find a spot adjacent to existing staff
    const staffPositions = Array.from(staffCells).map(pos => {
        const [row, col] = pos.split('-').map(Number);
        return { row, col };
    });

    // Check positions adjacent to existing staff first
    for (const staffPos of staffPositions) {
        // Check positions to the left and right of existing staff
        const adjacentPositions = [
            { row: staffPos.row, col: staffPos.col - 1 },
            { row: staffPos.row, col: staffPos.col + 1 }
        ];

        for (const pos of adjacentPositions) {
            if (pos.row > 0 && pos.col > 0 && 
                pos.row <= NUM_ROWS_GRID - cardHeight + 1 && 
                pos.col <= NUM_COLS_GRID - cardWidth + 1) {
                
                let isSlotAvailable = true;
                for (let h = 0; h < cardHeight; h++) {
                    for (let w = 0; w < cardWidth; w++) {
                        if (occupiedCells.has(`${pos.row + h}-${pos.col + w}`)) {
                            isSlotAvailable = false;
                            break;
                        }
                    }
                    if (!isSlotAvailable) break;
                }
                if (isSlotAvailable) return pos;
            }
        }
    }

    // If no adjacent spots found, fall back to standard left-to-right, top-to-bottom search
    for (let r = 1; r <= NUM_ROWS_GRID - cardHeight + 1; r++) {
        for (let c = 1; c <= NUM_COLS_GRID - cardWidth + 1; c++) {
            let isSlotAvailable = true;
            for (let h = 0; h < cardHeight; h++) {
                for (let w = 0; w < cardWidth; w++) {
                    if (occupiedCells.has(`${r + h}-${c + w}`)) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (!isSlotAvailable) break;
            }
            if (isSlotAvailable) return { row: r, col: c };
        }
    }

    return null;
}

// Automatic nurse assignment balancing
export function balanceNurseAssignments(nurses: Nurse[], patients: Patient[]): Nurse[] {
    // Get active patients (non-vacant, non-blocked)
    const activePatients = patients
        .filter(p => p.name !== 'Vacant' && !p.isBlocked)
        .sort((a, b) => {
            // Sort by room number for more logical distribution
            const roomA = parseInt(a.roomDesignation.replace(/\D/g, ''), 10) || 0;
            const roomB = parseInt(b.roomDesignation.replace(/\D/g, ''), 10) || 0;
            return roomA - roomB;
        });

    // Get available nurses
    const staffNurses = nurses.filter(n => 
        ['Staff Nurse', 'Float Pool Nurse'].includes(n.role)
    );

    if (staffNurses.length === 0 || activePatients.length === 0) {
        return nurses;
    }

    // Calculate optimal distribution
    const patientsPerNurse = Math.ceil(activePatients.length / staffNurses.length);
    let patientIndex = 0;

    // Create a map of current assignments to minimize disruption
    const currentAssignments = new Map<string, string[]>();
    staffNurses.forEach(nurse => {
        currentAssignments.set(nurse.id, nurse.assignedPatientIds.filter(Boolean) as string[]);
    });

    // Update nurse assignments
    const updatedNurses = nurses.map(nurse => {
        if (!['Staff Nurse', 'Float Pool Nurse'].includes(nurse.role)) {
            return nurse;
        }

        const currentAssigned = currentAssignments.get(nurse.id) || [];
        const newAssignments: string[] = [];

        // Try to keep current assignments if possible
        for (const patientId of currentAssigned) {
            if (activePatients.some(p => p.id === patientId)) {
                newAssignments.push(patientId);
            }
        }

        // Add new assignments up to the target number
        while (newAssignments.length < patientsPerNurse && patientIndex < activePatients.length) {
            const patientId = activePatients[patientIndex].id;
            if (!newAssignments.includes(patientId)) {
                newAssignments.push(patientId);
                patientIndex++;
            }
        }

        return {
            ...nurse,
            assignedPatientIds: newAssignments
        };
    });

    return updatedNurses;
}

// Helper to check if there's space for a new staff member
export function hasAvailableSpace(
    patients: Patient[],
    nurses: Nurse[],
    techs: PatientCareTech[],
    role: string
): boolean {
    const cardHeight = role === 'Staff Nurse' || role === 'Float Pool Nurse' ? 3 : 1;
    return findCompactEmptySlot(patients, nurses, techs, cardHeight, 1) !== null;
}
