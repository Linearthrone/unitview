
"use client";

import React, { useState, useEffect } from 'react';
import type { Patient } from '@/types/patient';
import PatientBlock from './patient-block';
import { generateInitialPatients } from '@/lib/initial-patients';
import { cn } from '@/lib/utils';

const NUM_COLS = 22;
const NUM_ROWS = 12;

interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}

const PatientGrid: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);

  useEffect(() => {
    const initialPatientsData = generateInitialPatients();
    setPatients(initialPatientsData);
  }, []);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    patientId: string,
    originalGridRow: number,
    originalGridColumn: number
  ) => {
    setDraggingPatientInfo({ id: patientId, originalGridRow, originalGridColumn });
    e.dataTransfer.setData('text/plain', patientId);
  };

  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  };

  const handleDropOnCell = (targetRow: number, targetCol: number) => {
    if (!draggingPatientInfo) return;

    const { id: draggedPatientId, originalGridRow, originalGridColumn } = draggingPatientInfo;

    setPatients(prevPatients => {
      const newPatients = prevPatients.map(p => ({...p})); // Create deep enough copies for modification
      const draggedPatient = newPatients.find(p => p.id === draggedPatientId);

      if (!draggedPatient) return prevPatients;

      const patientInTargetCell = newPatients.find(p => p.gridRow === targetRow && p.gridColumn === targetCol && p.id !== draggedPatientId);

      draggedPatient.gridRow = targetRow;
      draggedPatient.gridColumn = targetCol;

      if (patientInTargetCell) {
        patientInTargetCell.gridRow = originalGridRow;
        patientInTargetCell.gridColumn = originalGridColumn;
      }
      return newPatients;
    });

    setDraggingPatientInfo(null);
  };

  const handleDragEnd = () => {
    setDraggingPatientInfo(null);
  };
  
  const renderGridCells = () => {
    const cells = [];
    for (let r = 1; r <= NUM_ROWS; r++) {
      for (let c = 1; c <= NUM_COLS; c++) {
        const patientInCell = patients.find(p => p.gridRow === r && p.gridColumn === c);
        cells.push(
          <div
            key={`${r}-${c}`}
            className={cn(
              "border border-border/30 min-h-[10rem] rounded-md",
              "flex items-stretch justify-stretch p-0.5", // Use stretch to make PatientBlock fill cell
              draggingPatientInfo && "hover:bg-secondary/50 transition-colors"
            )}
            onDragOver={handleDragOverCell}
            onDrop={() => handleDropOnCell(r, c)}
          >
            {patientInCell && (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, patientInCell.id, patientInCell.gridRow, patientInCell.gridColumn)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "cursor-grab w-full h-full",
                  draggingPatientInfo?.id === patientInCell.id && "opacity-50"
                )}
                data-patient-id={patientInCell.id}
              >
                <PatientBlock patient={patientInCell} isDragging={draggingPatientInfo?.id === patientInCell.id} />
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  if (patients.length === 0 && !draggingPatientInfo) {
      return <div className="text-center p-8">Initializing patient grid...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-2 p-4" // Reduced gap for tighter fit if many cards
        style={{
          gridTemplateColumns: `repeat(${NUM_COLS}, minmax(10rem, 1fr))`,
          gridTemplateRows: `repeat(${NUM_ROWS}, minmax(10rem, auto))`,
          alignContent: 'start', // Align rows to the start if they don't fill height
        }}
      >
        {renderGridCells()}
      </div>
    </div>
  );
};

export default PatientGrid;
