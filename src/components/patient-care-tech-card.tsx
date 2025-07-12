
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Users, XSquare } from 'lucide-react';
import type { PatientCareTech } from '@/types/nurse';
import { cn } from '@/lib/utils';

interface PatientCareTechCardProps {
  tech: PatientCareTech;
  onRemoveTech: (techId: string) => void;
  isEffectivelyLocked: boolean;
}

const PatientCareTechCard: React.FC<PatientCareTechCardProps> = ({ tech, onRemoveTech, isEffectivelyLocked }) => {

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEffectivelyLocked) return;
    onRemoveTech(tech.id);
  }

  return (
    <Card className={cn(
        "flex flex-col h-full shadow-lg bg-indigo-200 dark:bg-indigo-900 border-indigo-400 dark:border-indigo-600 relative",
        !isEffectivelyLocked && "cursor-grab"
    )}>
       {!isEffectivelyLocked && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-indigo-900/70 dark:text-indigo-200/70 hover:text-destructive hover:bg-destructive/10"
          onClick={handleRemoveClick}
          title={`Remove ${tech.name}`}
        >
          <XSquare className="h-4 w-4" />
        </Button>
      )}
      <CardHeader className="p-2 pr-8">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            <span>{tech.name}</span>
          </div>
          <span className="text-xs font-normal">{tech.spectra}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-grow flex flex-col justify-center items-center text-center">
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-bold text-sm">{tech.assignmentGroup || 'Unassigned'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientCareTechCard;
