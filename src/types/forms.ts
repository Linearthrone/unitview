
"use client";

import * as z from 'zod';
import type { MobilityStatus, PatientGender, CodeStatus, OrientationStatus, StaffRole } from '@/types/patient';

// From admit-patient-dialog.tsx
export const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];
export const GENDERS: PatientGender[] = ['Male', 'Female'];
export const CODE_STATUSES: CodeStatus[] = ['Full Code', 'DNR', 'DNI', 'DNR/DNI'];
export const DIETS = [
    "Regular", "NPO (Nothing by mouth)", "Cardiac Diet", "Diabetic Diet (ADA)", "Renal Diet", "Clear Liquids",
    "Full Liquids", "Mechanical Soft", "Pureed"
];
export const ORIENTATION_STATUSES: OrientationStatus[] = ['x1', 'x2', 'x3', 'x4'];

export const AdmitPatientFormSchema = z.object({
  bedNumber: z.coerce.number().min(1, "Bed number is required."),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(0, "Age must be a positive number.").max(130),
  gender: z.enum(GENDERS),
  chiefComplaint: z.string().min(1, "Chief complaint is required."),
  admitDate: z.date(),
  dischargeDate: z.date(),
  ldas: z.string().optional(),
  notes: z.string().optional(),
  diet: z.string().min(1, "Diet is required."),
  mobility: z.enum(MOBILITY_STATUSES),
  codeStatus: z.enum(CODE_STATUSES),
  orientationStatus: z.enum(ORIENTATION_STATUSES),
  assignedNurse: z.string().min(1, "Nurse assignment is required."),
  isFallRisk: z.boolean().default(false),
  isSeizureRisk: z.boolean().default(false),
  isAspirationRisk: z.boolean().default(false),
  isIsolation: z.boolean().default(false),
  isInRestraints: z.boolean().default(false),
  isComfortCareDNR: z.boolean().default(false),
});

export type AdmitPatientFormValues = z.infer<typeof AdmitPatientFormSchema>;


// From add-staff-member-dialog.tsx
export const STAFF_ROLES: StaffRole[] = [
    'Staff Nurse', 'Charge Nurse', 'Float Pool Nurse', 
    'Unit Clerk', 'Patient Care Tech', 'Sitter'
];

export const AddStaffMemberFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  role: z.enum(STAFF_ROLES),
  relief: z.string().optional(),
});

export type AddStaffMemberFormValues = z.infer<typeof AddStaffMemberFormSchema>;

// From create-unit-dialog.tsx
export const CreateUnitFormSchema = (existingLayouts: string[]) => z.object({
  designation: z.string()
    .min(3, { message: "Designation must be at least 3 characters." })
    .refine(val => !existingLayouts.map(l => l.toLowerCase()).includes(val.toLowerCase()), {
      message: "A unit with this designation already exists.",
    }),
  roomCount: z.coerce.number().min(1, "Unit must have at least one room.").max(100, "Maximum of 100 rooms allowed."),
  startNumber: z.coerce.number().min(1, "Starting room number must be at least 1."),
});

export type CreateUnitFormValues = z.infer<ReturnType<typeof CreateUnitFormSchema>>;
