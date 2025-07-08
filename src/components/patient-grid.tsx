
"use client";

import React from 'react';
import type { Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';
import PatientBlock from './patient-block';
import NurseAssignmentCard from './nurse-assignment-card';
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

interface PatientGridProps {
  patients: Patient[];
  nurses: Nurse[];
  isInitialized: boolean;
  isEffectivelyLocked: boolean;
  draggingPatientInfo: DraggingPatientInfo | null;
  draggingNurseInfo: DraggingNurseInfo | null;
  onSelectPatient: (patient: Patient) => void;
  onPatientDragStart: (e: React.DragEvent<HTMLDivElement>, patientId: string, row: number, col: number) => void;
  onNurseDragStart: (e: React.DragEvent<HTMLDivElement>, nurseId: string) => void;
  onDropOnCell: (targetRow: number, targetCol: number) => void;
  onDropOnNurseSlot: (nurseId: string, slotIndex: number) => void;
  onClearNurseAssignments: (nurseId: string) => void;
  onDragEnd: () => void;
  onAdmitPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDischargePatient: (patient: Patient) => void;
  onToggleBlockRoom: (patientId: string) => void;
  onEditDesignation: (patient: Patient) => void;
}

const PatientGrid: React.FC<PatientGridProps> = ({
  patients,
  nurses,
  isInitialized,
  isEffectivelyLocked,
  draggingPatientInfo,
  draggingNurseInfo,
  onSelectPatient,
  onPatientDragStart,
  onNurseDragStart,
  onDropOnCell,
  onDropOnNurseSlot,
  onClearNurseAssignments,
  onDragEnd,
  onAdmitPatient,
  onUpdatePatient,
  onDischargePatient,
  onToggleBlockRoom,
  onEditDesignation,
}) => {
  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if ((draggingPatientInfo || draggingNurseInfo) && !isEffectivelyLocked) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const nurseOccupiedCells = new Set<string>();
  nurses.forEach(nurse => {
    for (let i = 0; i < 3; i++) {
        nurseOccupiedCells.add(`${nurse.gridRow + i}-${nurse.gridColumn}`);
    }
  });

  const renderGridCells = () => {
    const cells = [];
    for (let r = 1; r <= NUM_ROWS_GRID; r++) {
      for (let c = 1; c <= NUM_COLS_GRID; c++) {
        // If a nurse card starts here, or this cell is occupied by a nurse card, skip rendering a patient/empty cell
        if (nurseOccupiedCells.has(`${r}-${c}`)) {
          continue;
        }

        const patientInCell = patients.find(p => p.gridRow === r && p.gridColumn === c);
        cells.push(
          <div
            key={`${r}-${c}`}
            className={cn(
              "border border-border/30 min-h-[12rem] rounded-md",
              "flex items-stretch justify-stretch",
              (draggingPatientInfo || draggingNurseInfo) && !isEffectivelyLocked && "hover:bg-secondary/50 transition-colors",
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
              draggingNurseInfo?.id === nurse.id && "opacity-50"
            )}
            style={{ 
              gridRowStart: nurse.gridRow, 
              gridColumnStart: nurse.gridColumn, 
              gridRowEnd: 'span 3' 
            }}
          >
            <NurseAssignmentCard
              nurse={nurse}
              patients={patients}
              onDropOnSlot={onDropOnNurseSlot}
              onClearAssignments={onClearNurseAssignments}
              isEffectivelyLocked={isEffectivelyLocked}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientGrid;
