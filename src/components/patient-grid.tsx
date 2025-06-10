
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Patient, StoredPatientPosition } from '@/types/patient';
import PatientBlock from './patient-block';
import { generateInitialPatients } from '@/lib/initial-patients';
import { layouts } from '@/lib/layouts'; // Import layouts object
import type { LayoutName } from '@/lib/layouts'; // Import LayoutName type
import { cn } from '@/lib/utils';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '@/lib/grid-utils';


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

  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isMeasuring, setIsMeasuring] = useState(false);

  const applyLayout = (layoutKey: LayoutName, base: Patient[]): Patient[] => {
    if (layouts && typeof layouts[layoutKey] === 'function') {
      return layouts[layoutKey](base);
    }
    console.error(
      `Layout function for "${layoutKey}" not found or not a function. Falling back to default.`,
      'Layouts object:', layouts
    );
    if (layouts && typeof layouts.default === 'function') {
      return layouts.default(base);
    }
    console.error("Critical: Default layout function also missing. Using base patient data.");
    return [...base.map(p => ({ ...p }))]; // Return a copy
  };

  // Effect for initializing and loading patients based on layout
  useEffect(() => {
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
          return savedPos ? { ...p, ...savedPos } : { ...p }; // Apply saved positions or use base
        });

      } else {
        finalPatientsData = applyLayout(currentLayoutName, basePatients);
        // And save this initial state of the predefined layout to localStorage
        const positionsToSave: StoredPatientPosition[] = finalPatientsData.map(p => ({
          id: p.id,
          gridRow: p.gridRow,
          gridColumn: p.gridColumn,
        }));
        localStorage.setItem(layoutStorageKey, JSON.stringify(positionsToSave));
      }
    } catch (error) {
      console.error(`Error processing layout ${currentLayoutName} from localStorage:`, error);
      finalPatientsData = applyLayout(currentLayoutName, basePatients);
    }

    setPatients(finalPatientsData);
    setIsInitialized(true);
  }, [currentLayoutName]); // Rerun when layout changes

  // Effect for saving patient positions to localStorage
  useEffect(() => {
    if (!isInitialized || patients.length === 0 || isEffectivelyLocked) return;

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


  // Effect for scaling the grid
  useEffect(() => {
    if (!isInitialized || !viewportRef.current || !gridRef.current) return;

    const calculateAndSetScale = () => {
      if (viewportRef.current && gridRef.current) {
        setIsMeasuring(true);

        requestAnimationFrame(() => {
            if (!viewportRef.current || !gridRef.current) {
                setIsMeasuring(false);
                return;
            }
            const viewportWidth = viewportRef.current.offsetWidth;
            const viewportHeight = viewportRef.current.offsetHeight;

            const originalTransform = gridRef.current.style.transform;
            gridRef.current.style.transform = 'scale(1)';

            const naturalGridWidth = gridRef.current.scrollWidth;
            const naturalGridHeight = gridRef.current.scrollHeight;

            gridRef.current.style.transform = originalTransform;
            setIsMeasuring(false);

            if (naturalGridWidth === 0 || naturalGridHeight === 0 || viewportWidth === 0 || viewportHeight === 0) {
                return;
            }

            const scaleX = viewportWidth / naturalGridWidth;
            const scaleY = viewportHeight / naturalGridHeight;
            let newScale = Math.min(scaleX, scaleY);

            if (!isFinite(newScale) || newScale <= 0.01) {
                newScale = 0.01;
            }
            setScale(newScale);
        });
      }
    };

    calculateAndSetScale();

    const resizeObserver = new ResizeObserver(calculateAndSetScale);
    resizeObserver.observe(viewportRef.current);

    const mutationObserver = new MutationObserver(calculateAndSetScale);
    if (gridRef.current) {
        mutationObserver.observe(gridRef.current, { childList: true, subtree: true, attributes: true, characterData: true });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [isInitialized, currentLayoutName]);


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
              "border border-border/30 min-h-[8rem] rounded-md", // Maintained min-h
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
                  "w-full h-full", // Ensure PatientBlock fills this div
                  !isEffectivelyLocked && "cursor-grab",
                  draggingPatientInfo?.id === patientInCell.id && "opacity-50"
                )}
                data-patient-id={patientInCell.id}
              >
                <PatientBlock patient={patientInCell} isDragging={draggingPatientInfo?.id === patientInCell.id && !isEffectivelyLocked} />
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
    <div ref={viewportRef} className="flex-grow flex overflow-hidden">
      <div
        ref={gridRef}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${NUM_COLS_GRID}, minmax(8rem, 1fr))`,
          gridTemplateRows: `repeat(${NUM_ROWS_GRID}, minmax(8rem, auto))`,
          alignContent: 'start',
          transform: `scale(${isMeasuring ? 1 : scale})`,
          transformOrigin: 'top left',
          willChange: 'transform',
          transition: isMeasuring ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {renderGridCells()}
      </div>
    </div>
  );
};

export default PatientGrid;

