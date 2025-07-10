
import type { Patient } from '@/types/patient';

// Helper function to get a copy of base patients to avoid direct mutation
const getClonedPatients = (basePatients: Patient[]): Patient[] =>
  basePatients.map(p => ({ ...p }));

// Default layout: Now just returns the base patients, which is a minimal set.
export const defaultLayout = (basePatients: Patient[]): Patient[] => {
  return getClonedPatients(basePatients);
};

const northSouthLayout = (basePatients: Patient[]): Patient[] => {
    const clonedPatients = getClonedPatients(basePatients);
    const layoutPatients: Patient[] = [];

    const roomCoordinates: { [key: number]: { row: number; col: number } } = {
        // Left side, outer columns
        26: { row: 1, col: 1 },
        25: { row: 2, col: 1 },
        24: { row: 3, col: 1 },
        23: { row: 4, col: 1 },
        22: { row: 5, col: 1 },
        21: { row: 6, col: 1 },
        20: { row: 7, col: 1 },
        19: { row: 8, col: 1 },
        18: { row: 1, col: 3 },
        17: { row: 2, col: 3 },
        16: { row: 3, col: 3 },
        15: { row: 4, col: 3 },
        14: { row: 5, col: 3 },
        13: { row: 6, col: 3 },
        12: { row: 7, col: 3 },
        11: { row: 8, col: 3 },
        27: { row: 1, col: 2 },
        28: { row: 2, col: 2 },
        29: { row: 3, col: 2 },
        30: { row: 4, col: 2 },
        // Left side, inner columns (moving right)
        31: { row: 1, col: 6 },
        32: { row: 2, col: 6 },
        33: { row: 3, col: 6 },
        34: { row: 4, col: 6 },
        35: { row: 5, col: 6 },
        36: { row: 6, col: 6 },
        // Bottom row
        37: { row: 7, col: 7 },
        38: { row: 7, col: 8 },
        39: { row: 7, col: 9 },
        40: { row: 7, col: 10 },
        // Right side, outer columns
        10: { row: 1, col: 16 },
        9: { row: 2, col: 16 },
        8: { row: 3, col: 16 },
        7: { row: 4, col: 16 },
        // Right side, inner columns (moving left)
        6: { row: 1, col: 11 },
        5: { row: 2, col: 11 },
        4: { row: 3, col: 11 },
        3: { row: 4, col: 11 },
        2: { row: 5, col: 11 },
        1: { row: 6, col: 11 },
    };

    let bedCounter = 1;
    const sortedRooms = Object.keys(roomCoordinates).map(Number).sort((a,b) => a - b);
    
    for (const roomNum of sortedRooms) {
        const coords = roomCoordinates[roomNum];
        // Try to find an existing patient to repurpose
        let patient = clonedPatients.find(p => p.bedNumber === bedCounter);
        if (!patient) {
            // If no existing patient, create a new vacant one
             patient = {
                id: `patient-${bedCounter}-${Date.now()}`,
                bedNumber: bedCounter,
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
                gridRow: -1,
                gridColumn: -1,
            };
        }
        
        patient.gridRow = coords.row;
        patient.gridColumn = coords.col;
        patient.roomDesignation = `Room ${roomNum}`;
        layoutPatients.push(patient);
        bedCounter++;
    }

    return layoutPatients;
};

export const layouts: Record<string, (basePatients: Patient[]) => Patient[]> = {
  'default': defaultLayout,
  '8 North South': northSouthLayout,
};
