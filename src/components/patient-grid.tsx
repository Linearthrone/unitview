"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Patient } from '@/types/patient';
import PatientBlock from './patient-block';
import ReportSheet from './report-sheet';
import { generateInitialPatients } from '@/lib/initial-patients';
import { layouts as importedGridLayouts, type LayoutName } from '@/lib/layouts';
import { cn } from '@/lib/utils';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';

interface StoredPatientPosition {
  id: string;
  gridRow: number;
  gridColumn: number;
}

interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}

interface PatientGridProps {
  isEffectivelyLocked: boolean;
  currentLayoutName: LayoutName;
}

const PatientGrid: React.FC<PatientGridProps> = ({ isEffectivelyLocked, currentLayoutName }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const applyLayout = useCallback((layoutKey: LayoutName, base: Patient[]): Patient[] => {
    if (importedGridLayouts && typeof importedGridLayouts === 'object' && importedGridLayouts[layoutKey] && typeof importedGridLayouts[layoutKey] === 'function') {
      return importedGridLayouts[layoutKey](base);
    }
    console.error(
      `Layout function for "${layoutKey}" not found or not a function. Falling back to default.`,
      'Layouts object:', importedGridLayouts
    );
    if (importedGridLayouts && typeof importedGridLayouts === 'object' && importedGridLayouts.default && typeof importedGridLayouts.default === 'function') {
      return importedGridLayouts.default(base);
    }
    console.error("Critical: Default layout function also missing or layouts object is not as expected. Using base patient data.");
    return [...base.map(p => ({ ...p }))];
  }, []);

  useEffect(() => {
    if (!currentLayoutName) {
        console.warn("PatientGrid: currentLayoutName is undefined. Waiting for valid layout name.");
        return;
    }

    const basePatients = generateInitialPatients();
    const layoutStorageKey = `patientGridLayout_${currentLayoutName}`;
    let finalPatientsData: Patient[];

    try {
      const savedLayoutJSON = localStorage.getItem(layoutStorageKey);
      if (savedLayoutJSON) {
        const savedPositions = JSON.parse(savedLayoutJSON) as StoredPatientPosition[];
        const positionMap = new Map(savedPositions.map(p => [p.id, { gridRow: p.gridRow, gridColumn: p.gridColumn }]));

        finalPatientsData = basePatients.map(p => {
          const savedPos = positionMap.get(p.id);
          // Re-apply all generated data, but keep saved positions
          return savedPos ? { ...p, ...savedPos } : { ...p };
        });

      } else {
        finalPatientsData = applyLayout(currentLayoutName, basePatients);
        if (currentLayoutName !== 'eighthFloor') { // Do not save initial layout for locked floor
            const positionsToSave: StoredPatientPosition[] = finalPatientsData.map(p => ({
              id: p.id,
              gridRow: p.gridRow,
              gridColumn: p.gridColumn,
            }));
            localStorage.setItem(layoutStorageKey, JSON.stringify(positionsToSave));
        }
      }
    } catch (error) {
      console.error(`Error processing layout ${currentLayoutName} from localStorage:`, error);
      finalPatientsData = applyLayout(currentLayoutName, basePatients);
    }

    setPatients(finalPatientsData);
    setIsInitialized(true);
  }, [currentLayoutName, applyLayout]);

  useEffect(() => {
    if (!isInitialized || patients.length === 0 || isEffectivelyLocked || !currentLayoutName) return;

    const layoutStorageKey = `patientGridLayout_${currentLayoutName}`;
    try {
      const positionsToSave: StoredPatientPosition[] = patients.map(p => ({
        id: p.id,
        gridRow: p.gridRow,
        gridColumn: p.gridColumn,
      }));
      localStorage.setItem(layoutStorageKey, JSON.stringify(positionsToSave));
    } catch (error) {
      console.error(`Error saving patient layout ${currentLayoutName} to localStorage:`, error);
    }
  }, [patients, isInitialized, currentLayoutName, isEffectivelyLocked]);


  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    patientId: string,
    originalGridRow: number,
    originalGridColumn: number
  ) => {
    if (isEffectivelyLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo({ id: patientId, originalGridRow, originalGridColumn });
    e.dataTransfer.setData('text/plain', patientId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingPatientInfo && !isEffectivelyLocked) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDropOnCell = useCallback((targetRow: number, targetCol: number) => {
    if (!draggingPatientInfo || isEffectivelyLocked) return;

    const { id: draggedPatientId, originalGridRow, originalGridColumn } = draggingPatientInfo;

    setPatients(prevPatients => {
      const newPatients = prevPatients.map(p => ({...p}));
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
  }, [draggingPatientInfo, isEffectivelyLocked]);

  const handleDragEnd = () => {
    setDraggingPatientInfo(null);
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
              "border border-border/30 min-h-[8rem] rounded-md",
              "flex items-stretch justify-stretch",
              draggingPatientInfo && !isEffectivelyLocked && "hover:bg-secondary/50 transition-colors",
              !patientInCell && "bg-card"
            )}
            onDragOver={!isEffectivelyLocked ? handleDragOverCell : undefined}
            onDrop={!isEffectivelyLocked ? () => handleDropOnCell(r, c) : undefined}
            style={{ gridRowStart: r, gridColumnStart: c }}
          >
            {patientInCell && (
              <div
                draggable={!isEffectivelyLocked}
                onDragStart={(e) => handleDragStart(e, patientInCell.id, patientInCell.gridRow, patientInCell.gridColumn)}
                onDragEnd={handleDragEnd}
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
                  onSelectPatient={() => setSelectedPatient(patientInCell)}
                />
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

   if (!isInitialized || !currentLayoutName) {
      return <div className="flex-grow flex items-center justify-center text-center p-8">Initializing patient grid...</div>;
  }

  return (
    <div className="flex-grow flex overflow-auto p-2">
      <div
        ref={gridRef}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${NUM_COLS_GRID}, minmax(8rem, 1fr))`,
          gridTemplateRows: `repeat(${NUM_ROWS_GRID}, minmax(8rem, auto))`,
          alignContent: 'start',
          gap: '0.25rem',
        }}
      >
        {renderGridCells()}
      </div>
       <ReportSheet
        patient={selectedPatient}
        open={!!selectedPatient}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedPatient(null);
          }
        }}
      />
    </div>
  );
};

export default PatientGrid;
