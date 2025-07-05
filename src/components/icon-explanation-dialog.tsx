"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  BrainCircuit,
  Wind,
  ShieldAlert,
  Ban,
  HeartHandshake,
  BedDouble,
  Accessibility,
  Footprints,
  UserPlus,
  LayoutGrid,
  Printer,
  Save,
  Lock,
  Unlock,
  HelpCircle,
  Stethoscope,
  UserMinus,
  User,
  UserRound,
  Cake,
  VenetianMask,
  FileText,
  CalendarDays,
  Utensils,
  FileHeart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconSections = [
  {
    title: 'Patient Card & Report Alerts',
    icons: [
      { Icon: AlertTriangle, description: 'Fall Risk' },
      { Icon: BrainCircuit, description: 'Seizure Risk' },
      { Icon: Wind, description: 'Aspiration Risk' },
      { Icon: ShieldAlert, description: 'Isolation Precautions' },
      { Icon: Ban, description: 'In Restraints' },
      { Icon: HeartHandshake, description: 'Comfort Care / DNR' },
    ],
  },
  {
    title: 'Mobility Status',
    icons: [
      { Icon: BedDouble, description: 'Bed Rest' },
      { Icon: Accessibility, description: 'Assisted' },
      { Icon: Footprints, description: 'Independent' },
    ],
  },
  {
    title: 'Header Actions',
    icons: [
      { Icon: UserPlus, description: 'Admit / Transfer-In Patient' },
      { Icon: LayoutGrid, description: 'Select Unit Layout' },
      { Icon: Printer, description: 'Print Charge Report' },
      { Icon: Save, description: 'Save Layout As...' },
      { Icon: Lock, description: 'Layout Locked' },
      { Icon: Unlock, description: 'Layout Unlocked' },
      { Icon: HelpCircle, description: 'Icon Explanation' },
    ],
  },
  {
    title: 'General & Report Sheet',
    icons: [
      { Icon: Stethoscope, description: 'Application Logo' },
      { Icon: UserMinus, description: 'Discharge / Transfer-Out Patient' },
      { Icon: User, description: 'Patient Name' },
      { Icon: UserRound, description: 'Assigned Nurse' },
      { Icon: Cake, description: 'Patient Age' },
      { Icon: VenetianMask, description: 'Patient Gender' },
      { Icon: FileText, description: 'Chief Complaint' },
      { Icon: CalendarDays, description: 'Date (Admit / EDD)' },
      { Icon: Utensils, description: 'Patient Diet' },
      { Icon: FileHeart, description: 'Lines, Drains, Airways (LDAs)' },
    ],
  },
];

const IconRow = ({ Icon, description }: { Icon: LucideIcon, description: string }) => (
  <div className="flex items-center gap-4 py-2 hover:bg-secondary/50 rounded px-2">
    <Icon className="h-6 w-6 text-primary flex-shrink-0" strokeWidth={2.5} />
    <span className="text-sm text-foreground">{description}</span>
  </div>
);

export default function IconExplanationDialog({ open, onOpenChange }: IconExplanationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Icon Explanation</DialogTitle>
          <DialogDescription>
            A guide to the icons used throughout the application.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {iconSections.map((section, index) => (
              <div key={section.title}>
                <h3 className="font-semibold mb-2 text-primary">{section.title}</h3>
                <div className="flex flex-col gap-1">
                  {section.icons.map(iconInfo => (
                    <IconRow key={iconInfo.description} {...iconInfo} />
                  ))}
                </div>
                {index < iconSections.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
