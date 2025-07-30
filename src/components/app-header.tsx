
"use client";

import React, { useState, useEffect } from 'react';
import { 
    Stethoscope, Lock, Unlock, Printer, Save, UserPlus, 
    HelpCircle, ListTodo, PlusSquare, TestTube, Users, 
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
import IconExplanationDialog from './icon-explanation-dialog';
import { Separator } from './ui/separator';

interface AppHeaderProps {
  title: string;
  activePatientCount: number;
  totalRoomCount: number;
  dnrCount: number;
  restraintCount: number;
  foleyCount: number;
  isLayoutLocked: boolean;
  onToggleLayoutLock: () => void;
  onPrint: (reportType: 'charge' | 'assignments') => void;
  onSaveCurrentLayout: () => void;
  onAdmitPatient: () => void;
  onAddStaffMember: () => void;
  onManageSpectra: () => void;
  onAddRoom: () => void;
  onInsertMockData: () => void;
  onSaveAssignments: () => void;
}

const StatDisplay: React.FC<{ icon: React.ElementType, label: string, value: number, className?: string }> = ({ icon: Icon, label, value, className }) => (
    <div className={`flex items-center gap-2 ${className}`}>
        <Icon className="h-5 w-5" />
        <span className="font-semibold">{value}</span>
        <span className="text-sm text-muted-foreground hidden lg:inline">{label}</span>
    </div>
);

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  activePatientCount,
  totalRoomCount,
  dnrCount,
  restraintCount,
  foleyCount,
  isLayoutLocked,
  onToggleLayoutLock,
  onPrint,
  onSaveCurrentLayout,
  onAdmitPatient,
  onAddStaffMember,
  onManageSpectra,
  onAddRoom,
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
      <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50 print-hide">
        <div className="container mx-auto flex items-center justify-between">
          
          {/* Left Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-3xl font-headline font-bold text-primary">{title}</h1>
                <p className="text-lg text-muted-foreground font-semibold">{activePatientCount} Patients / {totalRoomCount} Rooms</p>
              </div>
            </div>
             <Separator orientation="vertical" className="h-12" />
             <div className="flex items-center gap-4 text-lg">
                <StatDisplay icon={HeartHandshake} label="DNR" value={dnrCount} className="text-purple-600" />
                <StatDisplay icon={Ban} label="Restraints" value={restraintCount} className="text-destructive" />
                <StatDisplay icon={Droplet} label="Foleys" value={foleyCount} className="text-blue-500" />
             </div>
          </div>
          
          {/* Center Section */}
          <div className="flex-col items-center">
            <div className="font-bold text-2xl text-center">
                {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Loading...'}
            </div>
            <div className="text-sm text-muted-foreground">
                {currentTime ? currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
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
            
            <Separator orientation="vertical" className="h-10 mx-2" />

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
                  <DropdownMenuItem onClick={onAddRoom}>
                    <PlusSquare /> Create New Room
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
        </div>
      </header>
      <IconExplanationDialog open={isExplanationOpen} onOpenChange={setIsExplanationOpen} />
    </>
  );
};

export default AppHeader;
