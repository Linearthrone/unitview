
import type { Patient, MobilityStatus, PatientGender } from '@/types/patient';
import { getPerimeterCells, NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils'; // Added import

const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];
const GENDERS: PatientGender[] = ['Male', 'Female'];
// NUM_COLS_GRID and NUM_ROWS_GRID are now imported

const FIRST_NAMES = [
  "Aisha", "Alejandro", "Alina", "Ananya", "Andrei", "Astrid", "Ben", "Bianca", "Carlos", "Chen",
  "Chloe", "Chukwudi", "Clara", "Daniel", "Daria", "David", "Elena", "Elias", "Emily", "Ethan",
  "Fatima", "Finn", "Freya", "Gabriel", "Gia", "Hiroshi", "Isabel", "Ivan", "Javier", "Ji-woo",
  "Juan", "Julia", "Kenji", "Khaled", "Lars", "Leila", "Liam", "Linnea", "Luca", "Maria",
  "Mateo", "Mei", "Mohammed", "Nia", "Nikolai", "Noor", "Olivia", "Omar", "Priya", "Quinn",
  "Raj", "Rina", "Samira", "Santiago", "Sofia", "Sven", "Tariq", "Yara", "Yuki", "Zane"
];

const LAST_NAMES = [
  "Abbott", "Ahmed", "Alvarez", "Andersen", "Andersson", "Bailey", "Bell", "Berger", "Brown", "Campbell",
  "Carter", "Chen", "Choi", "Christensen", "Clark", "Costa", "Das", "Davies", "Dubois", "Edwards",
  "Evans", "Fernandez", "Garcia", "Gomez", "Gupta", "Hansen", "Hernandez", "Hoffmann", "Hughes", "Ivanov",
  "Jackson", "Johansson", "Jones", "Kang", "Khan", "Kim", "Kowalski", "Kumar", "Lee", "Lewis",
  "Liu", "Lopez", "Martin", "Martinez", "Miller", "Mohammed", "Morales", "Müller", "Murphy", "Nakamura",
  "Nguyen", "Novak", "Olsen", "Patel", "Pereira", "Peterson", "Popescu", "Ramirez", "Roberts", "Rodriguez",
  "Rossi", "Russo", "Santos", "Schmidt", "Schmitt", "Schneider", "Scott", "Silva", "Singh", "Smith",
  "Smirnov", "Sørensen", "Suzuki", "Tanaka", "Taylor", "Thomas", "Thompson", "Torres", "Tran", "Van Der Berg",
  "Vargas", "Vasquez", "Wagner", "Walker", "Wang", "Weber", "White", "Williams", "Wilson", "Wright",
  "Yamamoto", "Yang", "Yilmaz", "Young", "Zhang", "Zimmermann"
];

const SAMPLE_NOTES = [
  "Patient stable, monitoring vital signs.",
  "Family visit scheduled for tomorrow afternoon.",
  "Complaining of mild headache, administered PRN.",
  "Requires assistance with all ADLs.",
  "Discharge planning initiated, awaiting social work consult.",
  "Post-op day 2, incision clean, dry, and intact.",
  "New medication started, observing for side effects.",
  "Encouraged fluid intake, patient cooperative.",
  "Physical therapy session completed, good effort.",
  "Awaiting lab results.",
  "Oriented x3, mood appears anxious.",
  "Diabetic diet, blood sugar levels monitored.",
  "History of hypertension.",
  "Allergies: Penicillin.",
  "Scheduled for MRI this evening.",
  "Needs regular repositioning to prevent pressure sores.",
  "Consulted with nutritionist for dietary needs.",
  "Patient expressed concerns about recovery.",
  "Good appetite at lunch.",
  "Received flu vaccine."
];


export const generateInitialPatients = (): Patient[] => {
  const patients: Patient[] = [];
  const today = new Date();

  const perimeterCells = getPerimeterCells(); // Use shared utility

  for (let i = 0; i < 48; i++) {
    const admitDate = new Date(today);
    admitDate.setDate(today.getDate() - Math.floor(Math.random() * 30));

    const dischargeDate = new Date(admitDate);
    dischargeDate.setDate(admitDate.getDate() + Math.floor(Math.random() * 21) + 3);

    const position = perimeterCells[i % perimeterCells.length]; 

    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;

    const notes = Math.random() > 0.3 ? SAMPLE_NOTES[Math.floor(Math.random() * SAMPLE_NOTES.length)] : undefined;

    patients.push({
      id: `patient-${i + 1}`,
      bedNumber: i + 1,
      name: fullName,
      admitDate: admitDate,
      dischargeDate: dischargeDate,
      mobility: MOBILITY_STATUSES[i % MOBILITY_STATUSES.length],
      gender: GENDERS[i % GENDERS.length],
      isFallRisk: Math.random() > 0.6, 
      isIsolation: Math.random() > 0.75, 
      isInRestraints: Math.random() > 0.85, 
      isComfortCareDNR: Math.random() > 0.80, 
      notes: notes,
      gridRow: position.row,
      gridColumn: position.col,
    });
  }
  return patients;
};
