
"use client";

import React, { useState, useEffect } from 'react';
import { 
    Stethoscope, Lock, Unlock, LayoutGrid, Printer, Save, UserPlus, 
    HelpCircle, ListTodo, PlusSquare, Building2, TestTube, Users, 
    ClipboardSignature, HeartHandshake, Ban, Droplet, Archive
} from 'lucide-react';
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
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title: string;
  activePatientCount: number;
  totalRoomCount: number;
  dnrCount: number;
  restraintCount: number;
  foleyCount: number;
  isLayoutLocked: boolean;
  onToggleLayoutLock: () => void;
  currentLayoutName: LayoutName;
  onSelectLayout: (layoutName: LayoutName) => void;
  availableLayouts: LayoutName[];
  onPrint: (reportType: 'charge' | 'assignments') => void;
  onSaveLayout: () => void;
  onSaveCurrentLayout: () => void;
  onAdmitPatient: () => void;
  onAddStaffMember: () => void;
  onManageSpectra: () => void;
  onAddRoom: () => void;
  onCreateUnit: () => void;
  onInsertMockData: () => void;
  onSaveAssignments: () => void;
}

const StatDisplay: React.FC<{ icon: React.ElementType, label: string, value: number, className?: string }> = ({ icon: Icon, label, value, className }) => (
    <div className={cn("flex items-center gap-3 p-4 rounded-lg bg-secondary/50", className)}>
        <Icon className="h-8 w-8" />
        <div className="flex flex-col">
            <span className="text-4xl font-bold">{value}</span>
            <span className="text-lg text-muted-foreground">{label}</span>
        </div>
    </div>
);

const getFriendlyLayoutName = (layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'North-South View': return 'North/South View';
      default: return layoutName;
    }
  };

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  activePatientCount,
  totalRoomCount,
  dnrCount,
  restraintCount,
  foleyCount,
  isLayoutLocked,
  onToggleLayoutLock,
  currentLayoutName,
  onSelectLayout,
  availableLayouts,
  onPrint,
  onSaveLayout,
  onSaveCurrentLayout,
  onAdmitPatient,
  onAddStaffMember,
  onManageSpectra,
  onAddRoom,
  onCreateUnit,
  onInsertMockData,
  onSaveAssignments,
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
      // Set the initial time on the client to avoid hydration mismatch
      setCurrentTime(new Date());
      // Then set up the interval
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50 print-hide h-32">
        <div className="w-full flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
          
          {/* Left Section */}
          <div className="flex items-center gap-6 h-full">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-24 w-24 text-primary" />
              <div>
                <h1 className="text-6xl font-headline font-bold text-primary">{title}</h1>
                <p className="text-lg text-muted-foreground font-semibold">{activePatientCount} Patients / {totalRoomCount} Rooms</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-full" />
          </div>
          
          {/* Center Section - Stats */}
          <div className="flex-grow flex items-center justify-center gap-8 px-8">
             <StatDisplay icon={HeartHandshake} label="DNR" value={dnrCount} className="text-purple-600 flex-grow justify-center" />
             <StatDisplay icon={Ban} label="Restraints" value={restraintCount} className="text-destructive flex-grow justify-center" />
             <StatDisplay icon={Droplet} label="Foleys" value={foleyCount} className="text-blue-500 flex-grow justify-center" />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 h-full">
            <Separator orientation="vertical" className="h-full" />
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
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

                <div className="flex flex-col space-y-1">
                    <Button variant="outline" onClick={onAdmitPatient} title="Admit/Transfer-In">
                        <UserPlus /> Admit
                    </Button>
                    <Button variant="outline" onClick={onAddStaffMember} title="Add Staff">
                        <Users /> + Staff
                    </Button>
                    <Button variant="outline" onClick={onManageSpectra} title="Manage Spectra Pool">
                        <ListTodo /> Spectra
                    </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Printer /> Print
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onPrint('charge')}>
                            <Printer /> Print Charge Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrint('assignments')}>
                            <ClipboardSignature /> Print Assignments
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
             <Separator orientation="vertical" className="h-full" />

            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={onToggleLayoutLock} title={isLayoutLocked ? 'Unlock Layout' : 'Lock Layout'}>
                {isLayoutLocked ? <Lock /> : <Unlock />}
                </Button>
                <Button variant="outline" size="icon" onClick={onSaveCurrentLayout} disabled={isLayoutLocked} title="Save Current Layout">
                <Save />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <TestTube />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                    <DropdownMenuLabel>Dev & Admin Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onCreateUnit}>
                        <Building2 /> Create New Unit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddRoom}>
                        <PlusSquare /> Create New Room
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSaveLayout} disabled={isLayoutLocked}>
                        <Save /> Save Layout As...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onInsertMockData}>
                        <UserPlus /> Insert Mock Patients
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSaveAssignments}>
                        <Archive /> Save Shift Assignments
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsExplanationOpen(true)}>
                        <HelpCircle /> Icon Explanation
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <Separator orientation="vertical" className="h-full" />
            
            <div className="flex-col items-end text-right">
                <div className="font-bold text-4xl">
                    {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Loading...'}
                </div>
                <div className="text-3xl text-muted-foreground">
                    {currentTime ? currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </div>
            </div>
          </div>
        </div>
      </header>
      <IconExplanationDialog open={isExplanationOpen} onOpenChange={setIsExplanationOpen} />
    </>
  );
};

export default AppHeader;
