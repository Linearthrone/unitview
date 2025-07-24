
"use client";

import React from 'react';
import type { Patient, StaffRole } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import PatientBlock from './patient-block';
import NurseAssignmentCard from './nurse-assignment-card';
import PatientCareTechCard from './patient-care-tech-card';
import ChargeNurseCard from './charge-nurse-card';
import UnitClerkCard from './unit-clerk-card';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}
interface DraggingNurseInfo {
  id: string;
}
interface DraggingTechInfo {
  id: string;
}

interface PatientGridProps {
  patients: Patient[];
  nurses: Nurse[];
  techs: PatientCareTech[];
  isInitialized: boolean;
  isEffectivelyLocked: boolean;
  draggingPatientInfo: DraggingPatientInfo | null;
  draggingNurseInfo: DraggingNurseInfo | null;
  draggingTechInfo: DraggingTechInfo | null;
  onSelectPatient: (patient: Patient) => void;
  onPatientDragStart: (e: React.DragEvent<HTMLDivElement>, patientId: string, row: number, col: number) => void;
  onNurseDragStart: (e: React.DragEvent<HTMLDivElement>, nurseId: string) => void;
  onTechDragStart: (e: React.DragEvent<HTMLDivElement>, techId: string) => void;
  onDropOnCell: (targetRow: number, targetCol: number) => void;
  handleDropOnNurseSlot: (nurseId: string, slotIndex: number) => void;
  onClearNurseAssignments: (nurseId: string) => void;
  onDragEnd: () => void;
  onAdmitPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDischargePatient: (patient: Patient) => void;
  onToggleBlockRoom: (patientId: string) => void;
  onEditDesignation: (patient: Patient) => void;
  onRemoveNurse: (nurseId: string) => void;
  onRemoveTech: (techId: string) => void;
  onAssignStaff: (role: StaffRole) => void;
  onRemoveStaff: (role: StaffRole) => void;
}

const PatientGrid: React.FC<PatientGridProps> = ({
  patients,
  nurses,
  techs,
  isInitialized,
  isEffectivelyLocked,
  draggingPatientInfo,
  draggingNurseInfo,
  draggingTechInfo,
  onSelectPatient,
  onPatientDragStart,
  onNurseDragStart,
  onTechDragStart,
  onDropOnCell,
  handleDropOnNurseSlot,
  onClearNurseAssignments,
  onDragEnd,
  onAdmitPatient,
  onUpdatePatient,
  onDischargePatient,
  onToggleBlockRoom,
  onEditDesignation,
  onRemoveNurse,
  onRemoveTech,
  onAssignStaff,
  onRemoveStaff,
}) => {
  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if ((draggingPatientInfo || draggingNurseInfo || draggingTechInfo) && !isEffectivelyLocked) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const occupiedCells = new Set<string>();
  
  nurses.forEach(nurse => {
    const cardHeight = nurse.role === 'Staff Nurse' ? 3 : 1;
    for (let i = 0; i < cardHeight; i++) {
        occupiedCells.add(`${nurse.gridRow + i}-${nurse.gridColumn}`);
    }
  });

  techs.forEach(tech => {
    occupiedCells.add(`${tech.gridRow}-${tech.gridColumn}`);
  });

  const renderGridCells = () => {
    const cells = [];
    for (let r = 1; r <= NUM_ROWS_GRID; r++) {
      for (let c = 1; c <= NUM_COLS_GRID; c++) {
        if (occupiedCells.has(`${r}-${c}`)) {
          continue;
        }

        const patientInCell = patients.find(p => p.gridRow === r && p.gridColumn === c);
        cells.push(
          <div
            key={`${r}-${c}`}
            className={cn(
              "border border-border/30 min-h-[12rem] rounded-md",
              "flex items-stretch justify-stretch",
              (draggingPatientInfo || draggingNurseInfo || draggingTechInfo) && !isEffectivelyLocked && "hover:bg-secondary/50 transition-colors",
              !patientInCell && "bg-card"
            )}
            onDragOver={!isEffectivelyLocked ? handleDragOverCell : undefined}
            onDrop={!isEffectivelyLocked ? () => onDropOnCell(r, c) : undefined}
            style={{ gridRowStart: r, gridColumnStart: c }}
          >
            {patientInCell && (
              <div
                draggable={!isEffectivelyLocked && !patientInCell.isBlocked}
                onDragStart={(e) => onPatientDragStart(e, patientInCell.id, patientInCell.gridRow, patientInCell.gridColumn)}
                onDragEnd={onDragEnd}
                className={cn(
                  "w-full h-full",
                  !isEffectivelyLocked && !patientInCell.isBlocked && "cursor-grab",
                  draggingPatientInfo?.id === patientInCell.id && "opacity-50"
                )}
                data-patient-id={patientInCell.id}
              >
                <PatientBlock 
                  patient={patientInCell} 
                  isDragging={draggingPatientInfo?.id === patientInCell.id && !isEffectivelyLocked}
                  isEffectivelyLocked={isEffectivelyLocked}
                  onSelectPatient={onSelectPatient}
                  onAdmit={onAdmitPatient}
                  onUpdate={onUpdatePatient}
                  onDischarge={onDischargePatient}
                  onToggleBlock={onToggleBlockRoom}
                  onEditDesignation={onEditDesignation}
                />
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  if (!isInitialized) {
    return (
      <div className="flex-grow flex overflow-auto p-2">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${NUM_COLS_GRID}, minmax(12rem, 1fr))`,
            gridTemplateRows: `repeat(${NUM_ROWS_GRID}, minmax(12rem, auto))`,
            alignContent: 'start',
            gap: '0.25rem',
          }}
        >
          {Array.from({ length: 48 }).map((_, index) => (
            <div key={index} className="border border-border/30 rounded-md bg-card p-3 space-y-3">
               <div className="flex justify-between items-center">
                 <Skeleton className="h-5 w-1/3" />
                 <Skeleton className="h-5 w-1/4" />
               </div>
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderNurseCard = (nurse: Nurse) => {
    switch (nurse.role) {
      case 'Charge Nurse':
        return <ChargeNurseCard name={nurse.name} onAssign={onAssignStaff} onRemove={onRemoveStaff} />;
      case 'Unit Clerk':
        return <UnitClerkCard name={nurse.name} onAssign={onAssignStaff} onRemove={onRemoveStaff} />;
      case 'Staff Nurse':
      case 'Float Pool Nurse':
        return (
          <NurseAssignmentCard
            nurse={nurse}
            patients={patients}
            onDropOnSlot={handleDropOnNurseSlot}
            onClearAssignments={onClearNurseAssignments}
            onRemoveNurse={onRemoveNurse}
            isEffectivelyLocked={isEffectivelyLocked}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-grow flex overflow-auto p-2">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${NUM_COLS_GRID}, minmax(12rem, 1fr))`,
          gridTemplateRows: `repeat(${NUM_ROWS_GRID}, minmax(12rem, auto))`,
          alignContent: 'start',
          gap: '0.25rem',
        }}
      >
        {renderGridCells()}
        
        {nurses.map(nurse => (
          <div 
            key={nurse.id}
            draggable={!isEffectivelyLocked}
            onDragStart={(e) => onNurseDragStart(e, nurse.id)}
            onDragEnd={onDragEnd}
            className={cn(
              "min-h-[6rem]",
              draggingNurseInfo?.id === nurse.id && "opacity-50"
            )}
            style={{ 
              gridRowStart: nurse.gridRow, 
              gridColumnStart: nurse.gridColumn, 
              gridRowEnd: nurse.role === 'Staff Nurse' ? 'span 3' : 'span 1'
            }}
          >
            {renderNurseCard(nurse)}
          </div>
        ))}
        
        {techs.map(tech => (
          <div 
            key={tech.id}
            draggable={!isEffectivelyLocked}
            onDragStart={(e) => onTechDragStart(e, tech.id)}
            onDragEnd={onDragEnd}
            className={cn(
              "min-h-[6rem]", // Give it a min height to be visible when empty
              draggingTechInfo?.id === tech.id && "opacity-50"
            )}
            style={{ 
              gridRowStart: tech.gridRow, 
              gridColumnStart: tech.gridColumn,
            }}
          >
            <PatientCareTechCard
              tech={tech}
              onRemoveTech={onRemoveTech}
              isEffectivelyLocked={isEffectivelyLocked}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientGrid;
