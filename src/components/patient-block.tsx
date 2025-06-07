"use client";

import type { Patient, MobilityStatus, AlertDisplayInfo } from '@/types/patient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BedDouble,
  Accessibility,
  Footprints,
  CalendarPlus,
  CalendarCheck,
  AlertTriangle,
  ShieldAlert,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientBlockProps {
  patient: Patient;
  isDragging?: boolean;
}

const mobilityIcons: Record<MobilityStatus, LucideIcon> = {
  'Bed Rest': BedDouble,
  'Assisted': Accessibility,
  'Independent': Footprints,
};

const PatientBlock: React.FC<PatientBlockProps> = ({ patient, isDragging }) => {
  const MobilityIcon = mobilityIcons[patient.mobility];

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  const alerts: AlertDisplayInfo[] = [];
  if (patient.isFallRisk) {
    alerts.push({ IconComponent: AlertTriangle, colorClass: 'text-accent', tooltipText: 'Fall Risk' });
  }
  if (patient.isIsolation) {
    alerts.push({ IconComponent: ShieldAlert, colorClass: 'text-yellow-500', tooltipText: 'Isolation Precautions' });
  }

  return (
    <Card 
      className={cn(
        "flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200",
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      )}
      data-patient-id={patient.id}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Bed {patient.bedNumber}</span>
          <Badge variant="secondary" className="text-xs">{patient.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-grow space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-primary" />
          <span>Admit: {formatDate(patient.admitDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <span>Discharge: {formatDate(patient.dischargeDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MobilityIcon className="h-4 w-4 text-primary" />
          <span>Mobility: {patient.mobility}</span>
        </div>
        {patient.notes && (
          <p className="text-xs text-muted-foreground pt-1 border-t mt-2 italic">
            {patient.notes.length > 50 ? `${patient.notes.substring(0, 47)}...` : patient.notes}
          </p>
        )}
      </CardContent>
      {alerts.length > 0 && (
        <CardFooter className="p-3 border-t">
          <TooltipProvider delayDuration={100}>
            <div className="flex gap-2">
              {alerts.map(({ IconComponent, colorClass, tooltipText }, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <IconComponent className={cn("h-5 w-5", colorClass)} aria-label={tooltipText} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltipText}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </CardFooter>
      )}
    </Card>
  );
};

export default PatientBlock;
