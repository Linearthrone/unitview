'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Patient } from '@/types/patient';
import { cn } from '@/lib/utils';
import {
  User,
  Cake,
  VenetianMask,
  FileText,
  CalendarDays,
  Utensils,
  Footprints,
  FileHeart,
  AlertTriangle,
  BrainCircuit,
  Wind
} from 'lucide-react';

interface ReportSheetProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportSheet: React.FC<ReportSheetProps> = ({ patient, open, onOpenChange }) => {
  if (!patient) return null;

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const getRiskBadge = (text: string, Icon: React.ElementType, isApplicable: boolean) => {
    if (!isApplicable) return null;
    return (
      <Badge variant="destructive" className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span>{text}</span>
      </Badge>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto">
        <SheetHeader className="bg-secondary p-4 text-left sticky top-0 z-10 border-b">
          <SheetTitle className="text-2xl">{patient.name}</SheetTitle>
          <SheetDescription>Bed {patient.bedNumber} - Charge Nurse Report</SheetDescription>
        </SheetHeader>
        <div className="p-6 space-y-6">
          
          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Patient Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <span>Name: {patient.name}</span></div>
              <div className="flex items-center gap-3"><Cake className="h-4 w-4 text-muted-foreground" /> <span>Age: {patient.age}</span></div>
              <div className="flex items-center gap-3"><VenetianMask className="h-4 w-4 text-muted-foreground" /> <span>Gender: {patient.gender || 'N/A'}</span></div>
            </div>
          </section>

          <Separator />
          
          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Admission Details</h3>
            <div className="space-y-2 text-sm">
               <div className="flex items-start gap-3"><FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" /> <div><span className="font-medium">Chief Complaint:</span> {patient.chiefComplaint}</div></div>
               <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-muted-foreground" /> <span>Admit Date: {formatDate(patient.admitDate)}</span></div>
               <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-muted-foreground" /> <span>EDD: {formatDate(patient.dischargeDate)}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Clinical Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3"><Utensils className="h-4 w-4 text-muted-foreground" /> <span>Diet: {patient.diet}</span></div>
              <div className="flex items-center gap-3"><Footprints className="h-4 w-4 text-muted-foreground" /> <span>Mobility: {patient.mobility}</span></div>
              <div className="flex items-start gap-3"><FileHeart className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" /> <div><span className="font-medium">LDAs:</span> {patient.ldas.length > 0 ? patient.ldas.join(', ') : 'None'}</div></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">Alerts & Status</h3>
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                    <span className="font-medium w-28 shrink-0">Code Status:</span>
                    <Badge variant={patient.codeStatus === 'Full Code' ? 'secondary' : 'destructive'}>{patient.codeStatus}</Badge>
                </div>
                 <div className="flex items-center gap-3">
                    <span className="font-medium w-28 shrink-0">Isolation:</span>
                    <Badge variant={patient.isIsolation ? 'outline' : 'secondary'} className={cn(patient.isIsolation && "border-amber-500 text-amber-500")}>
                        {patient.isIsolation ? 'Yes' : 'No'}
                    </Badge>
                </div>
                 <div className="flex items-center gap-3">
                    <span className="font-medium w-28 shrink-0">Restraints:</span>
                     <Badge variant={patient.isInRestraints ? 'outline' : 'secondary'} className={cn(patient.isInRestraints && "border-red-500 text-red-500")}>
                        {patient.isInRestraints ? 'Yes' : 'No'}
                    </Badge>
                </div>
                 <div className="flex items-center gap-3">
                    <span className="font-medium w-28 shrink-0">Comfort Care:</span>
                     <Badge variant={patient.isComfortCareDNR ? 'outline' : 'secondary'} className={cn(patient.isComfortCareDNR && "border-purple-500 text-purple-500")}>
                        {patient.isComfortCareDNR ? 'Yes' : 'No'}
                    </Badge>
                </div>
            </div>
          </section>
          
          <Separator />

          <section>
            <h3 className="font-semibold text-lg mb-3 text-primary">High-Risk Categories</h3>
            <div className="flex flex-wrap gap-2">
                {getRiskBadge('Fall Risk', AlertTriangle, patient.isFallRisk)}
                {getRiskBadge('Seizure Risk', BrainCircuit, patient.isSeizureRisk)}
                {getRiskBadge('Aspiration Risk', Wind, patient.isAspirationRisk)}
                {!patient.isFallRisk && !patient.isSeizureRisk && !patient.isAspirationRisk && <p className="text-sm text-muted-foreground">No high-risk categories identified.</p>}
            </div>
          </section>
          
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReportSheet;
