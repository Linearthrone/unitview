
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
        // Row 1: 26 down to 19 (left side)
        26: { row: 1, col: 1 },
        25: { row: 1, col: 2 },
        24: { row: 1, col: 3 },
        23: { row: 1, col: 4 },
        22: { row: 1, col: 5 },
        21: { row: 1, col: 6 },
        20: { row: 1, col: 7 },
        19: { row: 1, col: 8 },
        // Row 1: 18 down to 11 (right side)
        18: { row: 1, col: 10 },
        17: { row: 1, col: 11 },
        16: { row: 1, col: 12 },
        15: { row: 1, col: 13 },
        14: { row: 1, col: 14 },
        13: { row: 1, col: 15 },
        12: { row: 1, col: 16 },
        11: { row: 1, col: 17 },

        // Vertical rooms on the sides
        27: { row: 2, col: 1 },
        10: { row: 2, col: 17 },
        28: { row: 3, col: 1 },
        9:  { row: 3, col: 17 },
        29: { row: 4, col: 1 },
        8:  { row: 4, col: 17 },

        // Row 5: 30 to 36 (left side)
        30: { row: 5, col: 1 },
        31: { row: 5, col: 2 },
        32: { row: 5, col: 3 },
        33: { row: 5, col: 4 },
        34: { row: 5, col: 5 },
        35: { row: 5, col: 6 },
        36: { row: 5, col: 7 },

        // Row 5: 1 up to 7 (right side) - REVERSED
        1: { row: 5, col: 11 },
        2: { row: 5, col: 12 },
        3: { row: 5, col: 13 },
        4: { row: 5, col: 14 },
        5: { row: 5, col: 15 },
        6: { row: 5, col: 16 },
        7: { row: 5, col: 17 },

        // Vertical rooms on the left below row 5
        37: { row: 6, col: 7 },
        38: { row: 7, col: 7 },
        39: { row: 8, col: 7 },
        40: { row: 9, col: 7 },
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
        patient.roomDesignation = `${roomNum < 10 ? '80' : '8'}${String(roomNum).padStart(2, '0')}`;
        layoutPatients.push(patient);
        bedCounter++;
    }

    return layoutPatients;
};

export const layouts: Record<string, (basePatients: Patient[]) => Patient[]> = {
  'default': defaultLayout,
  '*: North South': northSouthLayout,
};
