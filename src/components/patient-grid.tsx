
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Patient } from '@/types/patient';
import PatientBlock from './patient-block';
import { generateInitialPatients } from '@/lib/initial-patients';
import { cn } from '@/lib/utils';

const NUM_COLS = 22;
const NUM_ROWS = 12;
const LOCALSTORAGE_KEY_PATIENT_LAYOUT = 'patientGridLayout';

interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}

interface StoredPatientPosition {
  id: string;
  gridRow: number;
  gridColumn: number;
}

const PatientGrid: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isMeasuring, setIsMeasuring] = useState(false);

  useEffect(() => {
    const initialPatientsData = generateInitialPatients();
    let finalPatientsData = initialPatientsData;

    try {
      const savedLayoutJSON = localStorage.getItem(LOCALSTORAGE_KEY_PATIENT_LAYOUT);
      if (savedLayoutJSON) {
        const savedPositions = JSON.parse(savedLayoutJSON) as StoredPatientPosition[];
        const positionMap = new Map(savedPositions.map(p => [p.id, p]));

        finalPatientsData = initialPatientsData.map(p => {
          const savedPos = positionMap.get(p.id);
          if (savedPos) {
            return { ...p, gridRow: savedPos.gridRow, gridColumn: savedPos.gridColumn };
          }
          return p;
        });
      }
    } catch (error) {
      console.error("Error loading patient layout from localStorage:", error);
    }
    
    setPatients(finalPatientsData);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized || patients.length === 0) return;

    try {
      const positionsToSave: StoredPatientPosition[] = patients.map(p => ({
        id: p.id,
        gridRow: p.gridRow,
        gridColumn: p.gridColumn,
      }));
      localStorage.setItem(LOCALSTORAGE_KEY_PATIENT_LAYOUT, JSON.stringify(positionsToSave));
    } catch (error) {
      console.error("Error saving patient layout to localStorage:", error);
    }
  }, [patients, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

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
          
          const naturalGridWidth = gridRef.current.offsetWidth;
          const naturalGridHeight = gridRef.current.offsetHeight;

          setIsMeasuring(false);

          if (naturalGridWidth === 0 || naturalGridHeight === 0 || viewportWidth === 0 || viewportHeight === 0) {
            return;
          }

          const scaleX = viewportWidth / naturalGridWidth;
          const scaleY = viewportHeight / naturalGridHeight;
          const newScale = Math.min(scaleX, scaleY);

          if (isFinite(newScale) && newScale > 0.01) {
            setScale(newScale);
          }
        });
      }
    };

    calculateAndSetScale();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateAndSetScale, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isInitialized]);


  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    patientId: string,
    originalGridRow: number,
    originalGridColumn: number
  ) => {
    setDraggingPatientInfo({ id: patientId, originalGridRow, originalGridColumn });
    e.dataTransfer.setData('text/plain', patientId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    if (draggingPatientInfo) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDropOnCell = useCallback((targetRow: number, targetCol: number) => {
    if (!draggingPatientInfo) return;

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
  }, [draggingPatientInfo]);

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
              "border border-border/30 min-h-[10rem] rounded-md", // min-h might be overridden by grid row height but good for structure
              "flex items-stretch justify-stretch p-0.5", 
              draggingPatientInfo && "hover:bg-secondary/50 transition-colors"
            )}
            onDragOver={handleDragOverCell}
            onDrop={() => handleDropOnCell(r, c)}
            // style={{ minHeight: '10rem' }} // Explicit min-height for cells
          >
            {patientInCell && (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, patientInCell.id, patientInCell.gridRow, patientInCell.gridColumn)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "cursor-grab w-full h-full", // Ensure PatientBlock takes full cell space
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

  if (!isInitialized && !draggingPatientInfo) { // Keep simple loading state
      return <div className="text-center p-8">Initializing patient grid...</div>;
  }

  return (
    <div ref={viewportRef} className="flex-grow flex items-center justify-center overflow-hidden">
      <div
        ref={gridRef}
        className="grid gap-2 p-4" // p-4 contributes to natural size and will be scaled
        style={{
          gridTemplateColumns: `repeat(${NUM_COLS}, minmax(10rem, 1fr))`,
          gridTemplateRows: `repeat(${NUM_ROWS}, minmax(10rem, auto))`, // 'auto' allows content height, '10rem' for fixed square cells before scaling
          alignContent: 'start', 
          transform: `scale(${isMeasuring ? 1 : scale})`,
          transformOrigin: 'center center',
          // transition: isMeasuring ? 'none' : 'transform 0.2s ease-out', // Optional: smooth transition for scale changes
        }}
      >
        {renderGridCells()}
      </div>
    </div>
  );
};

export default PatientGrid;
