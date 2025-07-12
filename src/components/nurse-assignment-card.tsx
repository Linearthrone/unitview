
"use client";

import React from 'react';
import type { Nurse } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Users, Trash2, XSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NurseAssignmentCardProps {
  nurse: Nurse;
  patients: Patient[];
  onDropOnSlot: (nurseId: string, slotIndex: number) => void;
  onClearAssignments: (nurseId: string) => void;
  onRemoveNurse: (nurseId: string) => void;
  isEffectivelyLocked: boolean;
}

const NurseAssignmentCard: React.FC<NurseAssignmentCardProps> = ({
  nurse,
  patients,
  onDropOnSlot,
  onClearAssignments,
  onRemoveNurse,
  isEffectivelyLocked
}) => {
  const patientMap = new Map(patients.map(p => [p.id, p]));

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isEffectivelyLocked) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, slotIndex: number) => {
    e.preventDefault();
    if (isEffectivelyLocked) return;
    onDropOnSlot(nurse.id, slotIndex);
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEffectivelyLocked) return;
    onRemoveNurse(nurse.id);
  }

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg bg-secondary/50 border-primary/50 relative",
      !isEffectivelyLocked && "cursor-grab"
    )}>
       {!isEffectivelyLocked && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleRemoveClick}
          title={`Remove ${nurse.name}`}
        >
          <XSquare className="h-4 w-4" />
        </Button>
      )}
      <CardHeader className="p-3 pr-8">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <span>{nurse.name}</span>
        </CardTitle>
        <div className="text-xs text-muted-foreground flex flex-col">
            <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Spectra: {nurse.spectra}</span>
            </div>
            {nurse.relief && (
                <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>Relief: {nurse.relief}</span>
                </div>
            )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-3 flex-grow grid grid-cols-2 grid-rows-3 gap-2">
        {nurse.assignedPatientIds.map((patientId, index) => {
          const patient = patientId ? patientMap.get(patientId) : null;
          return (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "border-2 border-dashed rounded-md flex items-center justify-center text-sm font-semibold",
                isEffectivelyLocked ? "border-gray-400" : "border-primary/60 hover:bg-primary/10",
                patient ? "border-solid bg-card" : ""
              )}
            >
              {patient ? `Bed ${patient.bedNumber}` : 'Assign...'}
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="p-2 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onClearAssignments(nurse.id)}
          disabled={isEffectivelyLocked}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Assignments
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NurseAssignmentCard;
