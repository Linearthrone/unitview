import type { Patient, MobilityStatus, PatientGender, CodeStatus } from '@/types/patient';
import { getPerimeterCells } from '@/lib/grid-utils';

const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];
const GENDERS: PatientGender[] = ['Male', 'Female'];
const CODE_STATUSES: CodeStatus[] = ['Full Code', 'DNR', 'DNI', 'DNR/DNI'];

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

const CHIEF_COMPLAINTS = [
    "Chest pain and shortness of breath", "Post-operative care for appendectomy", "Exacerbation of COPD",
    "Community-acquired pneumonia", "Acute pancreatitis", "Sepsis secondary to UTI", "Fall with hip fracture",
    "Uncontrolled type 2 diabetes", "Abdominal pain, nausea, and vomiting", "Altered mental status",
    "Hypertensive crisis", "Gastrointestinal bleed", "Cellulitis of lower extremity", "Stroke evaluation",
    "New onset seizures"
];
const LDAS_SAMPLES = [
    ["Peripheral IV", "Foley catheter"], ["Central line", "Nasogastric tube"], ["Arterial line"], [],
    ["Peripheral IV"], ["Wound drain"], ["Chest tube"], ["PICC line", "Rectal tube"]
];
const DIETS = [
    "Regular", "NPO (Nothing by mouth)", "Cardiac Diet", "Diabetic Diet (ADA)", "Renal Diet", "Clear Liquids",
    "Full Liquids", "Mechanical Soft", "Pureed"
];

const SAMPLE_NOTES = [
  "Patient stable, monitoring vital signs.", "Family visit scheduled for tomorrow afternoon.",
  "Complaining of mild headache, administered PRN.", "Requires assistance with all ADLs.",
  "Discharge planning initiated, awaiting social work consult.", "Post-op day 2, incision clean, dry, and intact.",
  "New medication started, observing for side effects.", "Encouraged fluid intake, patient cooperative.",
  "Physical therapy session completed, good effort.", "Awaiting lab results.", "Oriented x3, mood appears anxious.",
  "Diabetic diet, blood sugar levels monitored.", "History of hypertension.", "Allergies: Penicillin.",
  "Scheduled for MRI this evening.", "Needs regular repositioning to prevent pressure sores.",
  "Consulted with nutritionist for dietary needs.", "Patient expressed concerns about recovery.",
  "Good appetite at lunch.", "Received flu vaccine."
];

export const generateInitialPatients = (): Patient[] => {
  const patients: Patient[] = [];
  const today = new Date();
  const perimeterCells = getPerimeterCells();

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
    const codeStatus = CODE_STATUSES[Math.floor(Math.random() * CODE_STATUSES.length)];

    patients.push({
      id: `patient-${i + 1}`,
      bedNumber: i + 1,
      name: fullName,
      age: Math.floor(Math.random() * 80) + 18,
      gender: GENDERS[i % GENDERS.length],
      admitDate: admitDate,
      dischargeDate: dischargeDate,
      chiefComplaint: CHIEF_COMPLAINTS[Math.floor(Math.random() * CHIEF_COMPLAINTS.length)],
      ldas: LDAS_SAMPLES[Math.floor(Math.random() * LDAS_SAMPLES.length)],
      diet: DIETS[Math.floor(Math.random() * DIETS.length)],
      mobility: MOBILITY_STATUSES[i % MOBILITY_STATUSES.length],
      codeStatus: codeStatus,
      isFallRisk: Math.random() > 0.6,
      isSeizureRisk: Math.random() > 0.85,
      isAspirationRisk: Math.random() > 0.8,
      isIsolation: Math.random() > 0.75,
      isInRestraints: Math.random() > 0.9,
      isComfortCareDNR: codeStatus.includes('DNR'),
      notes: notes,
      gridRow: position.row,
      gridColumn: position.col,
    });
  }
  return patients;
};
