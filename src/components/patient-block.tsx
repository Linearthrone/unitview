
"use client";

import type { Patient, MobilityStatus, AlertDisplayInfo } from '@/types/patient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
  UserPlus,
  UserMinus,
  Edit,
  Lock,
  Unlock,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientBlockProps {
  patient: Patient;
  isDragging?: boolean;
  isEffectivelyLocked?: boolean;
  onSelectPatient: (patient: Patient) => void;
  onAdmit: (patient: Patient) => void;
  onUpdate: (patient: Patient) => void;
  onDischarge: (patient: Patient) => void;
  onToggleBlock: (patientId: string) => void;
  onEditDesignation: (patient: Patient) => void;
}


const mobilityIcons: Record<MobilityStatus, LucideIcon> = {
  'Bed Rest': BedDouble,
  'Assisted': Accessibility,
  'Independent': Footprints,
};

const PatientBlock: React.FC<PatientBlockProps> = ({ 
  patient, 
  isDragging, 
  isEffectivelyLocked,
  onSelectPatient,
  onAdmit,
  onUpdate,
  onDischarge,
  onToggleBlock,
  onEditDesignation,
}) => {
  const isVacant = patient.name === 'Vacant';
  const { isBlocked } = patient;

  const handleCardClick = () => {
    if (isBlocked) return;
    onSelectPatient(patient);
  }

  if (isVacant && !isBlocked) {
    return (
       <ContextMenu>
        <ContextMenuTrigger disabled={isEffectivelyLocked}>
          <Card 
            onClick={handleCardClick}
            className="flex flex-col h-full shadow-lg bg-gray-200 dark:bg-gray-800 border-gray-400 cursor-pointer"
            title={`View report for ${patient.roomDesignation}`}
          >
            <CardHeader className="p-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{patient.roomDesignation}</span>
                <Badge variant="secondary">Vacant</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-grow flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Room Available</span>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAdmit(patient)}>
            <UserPlus className="mr-2 h-4 w-4" /> Admit Patient
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onEditDesignation(patient)}>
            <Edit className="mr-2 h-4 w-4" /> Change Designation
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
            <Lock className="mr-2 h-4 w-4" /> Block Room
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
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
    if (isBlocked) {
      return "bg-slate-400 dark:bg-slate-700 border-slate-600 dark:border-slate-800";
    }
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
    <ContextMenu>
      <ContextMenuTrigger disabled={isEffectivelyLocked}>
        <Card 
          onClick={handleCardClick}
          className={cn(
            "flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200",
            isBlocked ? "cursor-not-allowed" : "cursor-pointer",
            isDragging ? "opacity-50 ring-2 ring-primary" : "",
            getCardColors()
          )}
          data-patient-id={patient.id}
          title={isBlocked ? `${patient.roomDesignation} is blocked` : `View report for ${patient.name} in ${patient.roomDesignation}`}
        >
          {isBlocked && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-lg">
              <Ban className="h-12 w-12 text-white/80" />
            </div>
          )}
          <CardHeader className="p-3">
            <CardTitle className="text-lg font-normal">
                <div className="flex justify-between items-start">
                    <div className="font-bold">
                        {patient.roomDesignation}
                    </div>
                     {!isVacant && (
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
                    )}
                </div>
                 <div className="pt-1">
                    <Badge
                      variant={isVacant ? "secondary" : "default"}
                      className={cn(
                        "font-semibold text-base truncate block w-full text-center py-1 px-2",
                        isVacant && "bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                      )}
                      title={patient.name}
                    >
                        {patient.name}
                    </Badge>
                </div>
                {patient.assignedNurse && (
                  <div className="text-center text-xs font-medium text-card-foreground/90 pt-1">
                    {patient.assignedNurse}
                  </div>
                )}
            </CardTitle>
          </CardHeader>
           {!isVacant && (
            <>
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
                    <span className="font-semibold not-italic">Notes: </span>
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
            </>
          )}
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isBlocked ? (
          <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
            <Unlock className="mr-2 h-4 w-4" /> Unblock Room
          </ContextMenuItem>
        ) : (
          <>
            <ContextMenuItem onClick={() => onUpdate(patient)} disabled={isVacant}>
              <Edit className="mr-2 h-4 w-4" /> Update Info
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onAdmit(patient)} disabled={!isVacant}>
              <UserPlus className="mr-2 h-4 w-4" /> Admit Patient
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onDischarge(patient)} disabled={isVacant}>
              <UserMinus className="mr-2 h-4 w-4" /> Discharge Patient
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onEditDesignation(patient)}>
              <Edit className="mr-2 h-4 w-4" /> Change Designation
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
              <Lock className="mr-2 h-4 w-4" /> Block Room
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default PatientBlock;
