"use client";

import React, { useState } from 'react';
import { Stethoscope, Lock, Unlock, LayoutGrid, Printer, Save, UserPlus, HelpCircle } from 'lucide-react';
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
  subtitle?: string;
  isLayoutLocked: boolean;
  onToggleLayoutLock: () => void;
  currentLayoutName: LayoutName;
  onSelectLayout: (layoutName: LayoutName) => void;
  availableLayouts: LayoutName[];
  onPrint: () => void;
  onSaveLayout: () => void;
  onAdmitPatient: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  isLayoutLocked,
  onToggleLayoutLock,
  currentLayoutName,
  onSelectLayout,
  availableLayouts,
  onPrint,
  onSaveLayout,
  onAdmitPatient
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  const getFriendlyLayoutName = (layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'default': return 'Default Layout';
      case 'eighthFloor': return '8th Floor';
      case 'tenthFloor': return '10th Floor';
      default: return layoutName;
    }
  };

  return (
    <>
      <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50 print-hide">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-bold text-primary">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAdmitPatient}
              title="Admit or Transfer-In a new patient"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Admit Patient
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  {getFriendlyLayoutName(currentLayoutName)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
              onClick={onPrint}
              title="Print Charge Report"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onSaveLayout}
              disabled={isLayoutLocked}
              title={isLayoutLocked ? "Unlock to save changes" : "Save current layout as a new template"}
            >
              <Save className="mr-2 h-4 w-4" />
              Save As...
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleLayoutLock}
              disabled={currentLayoutName === 'eighthFloor'}
              title={currentLayoutName === 'eighthFloor' ? "8th Floor layout is always locked" : (isLayoutLocked ? 'Unlock Layout' : 'Lock Layout')}
            >
              {isLayoutLocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
              {isLayoutLocked ? 'Layout Locked' : 'Lock Layout'}
            </Button>
            <div className="border-l h-6"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExplanationOpen(true)}
              title="Icon Explanation"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Icon Explanation
            </Button>
          </div>
        </div>
      </header>
      <IconExplanationDialog open={isExplanationOpen} onOpenChange={setIsExplanationOpen} />
    </>
  );
};

export default AppHeader;
