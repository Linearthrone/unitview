
"use client";

import React, { useState } from 'react';
import { Stethoscope, Lock, Unlock, LayoutGrid, Printer, Save, UserPlus, HelpCircle, ListTodo, PlusSquare, Building2, TestTube, Users, ClipboardSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LayoutName } from '@/types/patient';
import IconExplanationDialog from './icon-explanation-dialog';

interface AppHeaderProps {
  title: string;
  activePatientCount: number;
  totalRoomCount: number;
  isLayoutLocked: boolean;
  onToggleLayoutLock: () => void;
  currentLayoutName: LayoutName;
  onSelectLayout: (layoutName: LayoutName) => void;
  availableLayouts: LayoutName[];
  onPrint: (reportType: 'charge' | 'assignments') => void;
  onSaveLayout: () => void;
  onAdmitPatient: () => void;
  onAddStaffMember: () => void;
  onManageSpectra: () => void;
  onAddRoom: () => void;
  onCreateUnit: () => void;
  onInsertMockData: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  activePatientCount,
  totalRoomCount,
  isLayoutLocked,
  onToggleLayoutLock,
  currentLayoutName,
  onSelectLayout,
  availableLayouts,
  onPrint,
  onSaveLayout,
  onAdmitPatient,
  onAddStaffMember,
  onManageSpectra,
  onAddRoom,
  onCreateUnit,
  onInsertMockData,
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  const getFriendlyLayoutName = (layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'default': return 'Default Layout';
      case '*: North South': return 'North/South View';
      default: return layoutName;
    }
  };

  return (
    <>
      <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50 print-hide">
        <div className="container mx-auto flex items-center justify-between">
          
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-headline font-bold text-primary">{title}</h1>
                <p className="text-sm text-muted-foreground">{activePatientCount} Patients / {totalRoomCount} Rooms</p>
              </div>
            </div>
          </div>
          
          {/* Center Section */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  {getFriendlyLayoutName(currentLayoutName)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Unit Layout</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableLayouts.map((layoutName) => (
                  <DropdownMenuItem
                    key={layoutName}
                    onClick={() => onSelectLayout(layoutName)}
                    disabled={layoutName === currentLayoutName}
                  >
                    {getFriendlyLayoutName(layoutName)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={onAdmitPatient}
              title="Admit or Transfer-In a new patient"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Admit Patient
            </Button>
             <Button
              variant="outline"
              size="sm"
              onClick={onAddStaffMember}
              title="Add a new staff member to the unit"
            >
              <Users className="mr-2 h-4 w-4" />
              + Staff Member
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                   <DropdownMenuItem onClick={() => onPrint('charge')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Charge Report
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onPrint('assignments')}>
                    <ClipboardSignature className="mr-2 h-4 w-4" />
                    Print Assignments
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateUnit}
              title="Create a new unit layout with pre-generated rooms"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Create Unit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddRoom}
              title="Create a new vacant room card"
            >
              <PlusSquare className="mr-2 h-4 w-4" />
              Create Room
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLayoutLock}
              title={isLayoutLocked ? 'Unlock Layout' : 'Lock Layout'}
            >
              {isLayoutLocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
              {isLayoutLocked ? 'Locked' : 'Lock'}
            </Button>
            <div className="border-l h-6"></div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <TestTube className="mr-2 h-4 w-4" />
                    Dev Tools
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Demo & Dev Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSaveLayout} disabled={isLayoutLocked}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Layout As...
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={onInsertMockData}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Insert Mock Patient Data
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onManageSpectra()}>
                    <ListTodo className="mr-2 h-4 w-4" />
                    Manage Spectra Pool
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => setIsExplanationOpen(true)}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Icon Explanation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>
      </header>
      <IconExplanationDialog open={isExplanationOpen} onOpenChange={setIsExplanationOpen} />
    </>
  );
};

export default AppHeader;

    