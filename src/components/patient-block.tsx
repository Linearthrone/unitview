"use client";

import type { Patient, MobilityStatus, AlertDisplayInfo } from '@/types/patient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BedDouble,
  Accessibility,
  Footprints,
  AlertTriangle,
  ShieldAlert,
  Ban,
  BrainCircuit,
  Wind,
  HeartHandshake,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientBlockProps {
  patient: Patient;
  isDragging?: boolean;
  onSelectPatient: () => void;
}

const mobilityIcons: Record<MobilityStatus, LucideIcon> = {
  'Bed Rest': BedDouble,
  'Assisted': Accessibility,
  'Independent': Footprints,
};

const PatientBlock: React.FC<PatientBlockProps> = ({ patient, isDragging, onSelectPatient }) => {
  if (patient.name === 'Vacant') {
    return (
      <Card 
        onClick={onSelectPatient}
        className="flex flex-col h-full shadow-lg bg-gray-200 dark:bg-gray-800 border-gray-400 cursor-pointer"
        title={`View report for Bed ${patient.bedNumber}`}
      >
        <CardHeader className="p-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Bed {patient.bedNumber}</span>
            <Badge variant="secondary">Vacant</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-grow flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Bed Available</span>
        </CardContent>
      </Card>
    );
  }
  
  const MobilityIcon = mobilityIcons[patient.mobility];

  const formatDate = (date: Date): string => {
    try {
      if (isNaN(date.getTime())) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    } catch {
      return 'N/A'
    }
  };

  const getCardColors = () => {
    if (patient.isComfortCareDNR) {
      return "bg-purple-300 dark:bg-purple-900 border-purple-500 dark:border-purple-700";
    }
    if (patient.gender === 'Male') {
      return "bg-sky-300 dark:bg-sky-900 border-sky-500 dark:border-sky-700";
    }
    if (patient.gender === 'Female') {
      return "bg-pink-300 dark:bg-pink-900 border-pink-500 dark:border-pink-700";
    }
    return "bg-card border-border";
  };

  const alerts: AlertDisplayInfo[] = [];
  if (patient.isFallRisk) {
    alerts.push({ IconComponent: AlertTriangle, colorClass: 'text-accent', tooltipText: 'Fall Risk' });
  }
  if (patient.isSeizureRisk) {
    alerts.push({ IconComponent: BrainCircuit, colorClass: 'text-accent', tooltipText: 'Seizure Risk' });
  }
  if (patient.isAspirationRisk) {
    alerts.push({ IconComponent: Wind, colorClass: 'text-accent', tooltipText: 'Aspiration Risk' });
  }
  if (patient.isIsolation) {
    alerts.push({ IconComponent: ShieldAlert, colorClass: 'text-accent', tooltipText: 'Isolation Precautions' });
  }
  if (patient.isInRestraints) {
    alerts.push({ IconComponent: Ban, colorClass: 'text-destructive', tooltipText: 'Restraints' }); 
  }
  if (patient.isComfortCareDNR) {
    alerts.push({ IconComponent: HeartHandshake, colorClass: 'text-purple-600 dark:text-purple-400', tooltipText: 'Comfort Care / DNR' });
  }
  
  return (
    <Card 
      onClick={onSelectPatient}
      className={cn(
        "flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer",
        isDragging ? "opacity-50 ring-2 ring-primary" : "",
        getCardColors()
      )}
      data-patient-id={patient.id}
      title={`View report for ${patient.name} in Bed ${patient.bedNumber}`}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-lg font-normal">
            <div className="flex justify-between items-start">
                <div className="font-bold">
                    Bed {patient.bedNumber}
                </div>
                <div className="text-right text-sm leading-tight">
                    <div>
                        <span className="text-xs font-light">Admit </span>
                        {formatDate(patient.admitDate)}
                    </div>
                    <div>
                        <span className="text-xs font-light">EDD </span>
                        {formatDate(patient.dischargeDate)}
                    </div>
                </div>
            </div>
            <div className="pt-1">
                <Badge
                  variant="secondary"
                  className="font-semibold text-base truncate block w-full text-center py-1 px-2"
                  title={patient.name}
                >
                    {patient.name}
                </Badge>
            </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-grow space-y-2 text-sm">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>Mobility:</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <MobilityIcon className="h-5 w-5 text-primary" strokeWidth={2.5} aria-label={patient.mobility} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{patient.mobility}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {patient.notes && (
          <p className="text-xs pt-1 border-t mt-2 italic">
            {patient.notes.length > 50 ? `${patient.notes.substring(0, 47)}...` : patient.notes}
          </p>
        )}
      </CardContent>
      {alerts.length > 0 && (
        <CardFooter className="p-3 border-t">
          <TooltipProvider delayDuration={100}>
            <div className="flex gap-2 flex-wrap">
              {alerts.map(({ IconComponent, colorClass, tooltipText }, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <IconComponent className={cn("h-5 w-5", colorClass)} strokeWidth={2.5} aria-label={tooltipText} />
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
