
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Smartphone, Users } from 'lucide-react';
import type { PatientCareTech } from '@/types/nurse';
import { cn } from '@/lib/utils';

interface PatientCareTechCardProps {
  tech: PatientCareTech;
  isEffectivelyLocked: boolean;
}

const PatientCareTechCard: React.FC<PatientCareTechCardProps> = ({ tech, isEffectivelyLocked }) => {
  return (
    <Card className={cn(
        "flex flex-col h-full shadow-lg bg-indigo-200 dark:bg-indigo-900 border-indigo-400 dark:border-indigo-600",
        !isEffectivelyLocked && "cursor-grab"
    )}>
      <CardHeader className="p-2">
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
