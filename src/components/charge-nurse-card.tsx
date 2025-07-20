
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Smartphone, UserPlus, UserX } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { StaffRole } from '@/types/patient';

interface ChargeNurseCardProps {
  name: string;
  onAssign: (role: StaffRole) => void;
  onRemove: (role: StaffRole) => void;
}

const ChargeNurseCard: React.FC<ChargeNurseCardProps> = ({ name, onAssign, onRemove }) => {
  return (
     <ContextMenu>
      <ContextMenuTrigger>
        <Card className="flex flex-col h-full shadow-lg bg-secondary/50 border-primary/50">
          <CardHeader className="p-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <span>Charge Nurse</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-grow flex flex-col justify-center items-center text-center">
            <div className="space-y-2">
                <div>
                    <p className="text-xl font-bold">{name}</p>
                </div>
                 <div>
                     <p className="font-bold text-lg flex items-center gap-2">
                        <Smartphone className="h-4 w-4"/>
                        <span>x5501</span>
                    </p>
                </div>
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onAssign('Charge Nurse')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Charge Nurse
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRemove('Charge Nurse')}
          disabled={name === 'Unassigned'}
        >
          <UserX className="mr-2 h-4 w-4" />
          Remove Charge Nurse
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ChargeNurseCard;
