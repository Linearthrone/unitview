
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Phone, User, UserPlus, UserX } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { StaffRole } from '@/types/patient';

interface UnitClerkCardProps {
  name: string;
  onAssign: (role: StaffRole) => void;
  onRemove: (role: StaffRole) => void;
}

const UnitClerkCard: React.FC<UnitClerkCardProps> = ({ name, onAssign, onRemove }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className="flex flex-col h-full shadow-md bg-secondary/50 border-accent/50">
          <CardHeader className="p-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-accent" />
              <span>Unit Clerk</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-grow flex flex-col justify-center items-center text-center">
            <div className="space-y-2">
                <div>
                    <p className="font-bold text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{name}</span>
                    </p>
                </div>
                 <div>
                    <p className="font-bold text-lg flex items-center gap-2">
                        <Phone className="h-4 w-4"/>
                        <span>(555) 123-4567</span>
                    </p>
                </div>
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onAssign('Unit Clerk')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Unit Clerk
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRemove('Unit Clerk')}
          disabled={name === 'Unassigned'}
        >
          <UserX className="mr-2 h-4 w-4" />
          Remove Unit Clerk
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default UnitClerkCard;
