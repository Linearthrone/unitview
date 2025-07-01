
"use client";

import React from 'react';
import type { Patient } from '@/types/patient';
import PatientBlock from './patient-block';
import { cn } from '@/lib/utils';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}

interface PatientGridProps {
  patients: Patient[];
  isInitialized: boolean;
  isEffectivelyLocked: boolean;
  draggingPatientInfo: DraggingPatientInfo | null;
  onSelectPatient: (patient: Patient) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, patientId: string, row: number, col: number) => void;
  onDropOnCell: (targetRow: number, targetCol: number) => void;
  onDragEnd: () => void;
}

const PatientGrid: React.FC<PatientGridProps> = ({
  patients,
  isInitialized,
  isEffectivelyLocked,
  draggingPatientInfo,
  onSelectPatient,
  onDragStart,
  onDropOnCell,
  onDragEnd,
}) => {
  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingPatientInfo && !isEffectivelyLocked) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const renderGridCells = () => {
    const cells = [];
    for (let r = 1; r <= NUM_ROWS_GRID; r++) {
      for (let c = 1; c <= NUM_COLS_GRID; c++) {
        const patientInCell = patients.find(p => p.gridRow === r && p.gridColumn === c);
        cells.push(
          <div
            key={`${r}-${c}`}
            className={cn(
              "border border-border/30 min-h-[12rem] rounded-md",
              "flex items-stretch justify-stretch",
              draggingPatientInfo && !isEffectivelyLocked && "hover:bg-secondary/50 transition-colors",
              !patientInCell && "bg-card"
            )}
            onDragOver={!isEffectivelyLocked ? handleDragOverCell : undefined}
            onDrop={!isEffectivelyLocked ? () => onDropOnCell(r, c) : undefined}
            style={{ gridRowStart: r, gridColumnStart: c }}
          >
            {patientInCell && (
              <div
                draggable={!isEffectivelyLocked}
                onDragStart={(e) => onDragStart(e, patientInCell.id, patientInCell.gridRow, patientInCell.gridColumn)}
                onDragEnd={onDragEnd}
                className={cn(
                  "w-full h-full",
                  !isEffectivelyLocked && "cursor-grab",
                  draggingPatientInfo?.id === patientInCell.id && "opacity-50"
                )}
                data-patient-id={patientInCell.id}
              >
                <PatientBlock 
                  patient={patientInCell} 
                  isDragging={draggingPatientInfo?.id === patientInCell.id && !isEffectivelyLocked}
                  onSelectPatient={() => onSelectPatient(patientInCell)}
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
      return <div className="flex-grow flex items-center justify-center text-center p-8">Initializing patient grid...</div>;
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
      </div>
    </div>
  );
};

export default PatientGrid;
