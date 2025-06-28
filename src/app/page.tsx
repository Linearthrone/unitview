
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';
import ReportSheet from '@/components/report-sheet';
import PrintableReport from '@/components/printable-report';
import { layouts as appLayouts, type LayoutName } from '@/lib/layouts';
import type { Patient } from '@/types/patient';
import { generateInitialPatients } from '@/lib/initial-patients';

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

export default function Home() {
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<LayoutName>('default');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const applyLayout = useCallback((layoutKey: LayoutName, base: Patient[]): Patient[] => {
    if (appLayouts && typeof appLayouts === 'object' && appLayouts[layoutKey] && typeof appLayouts[layoutKey] === 'function') {
      return appLayouts[layoutKey](base);
    }
    console.error(
      `Layout function for "${layoutKey}" not found or not a function. Falling back to default.`,
      'Layouts object:', appLayouts
    );
    if (appLayouts && typeof appLayouts === 'object' && appLayouts.default && typeof appLayouts.default === 'function') {
      return appLayouts.default(base);
    }
    console.error("Critical: Default layout function also missing or layouts object is not as expected. Using base patient data.");
    return [...base.map(p => ({ ...p }))];
  }, []);

  useEffect(() => {
    if (!currentLayoutName) {
        console.warn("Home: currentLayoutName is undefined. Waiting for valid layout name.");
        return;
    }

    const basePatients = generateInitialPatients();
    const layoutStorageKey = `patientGridLayout_${currentLayoutName}`;
    let finalPatientsData: Patient[];

    try {
      const savedLayoutJSON = localStorage.getItem(layoutStorageKey);
      if (savedLayoutJSON && currentLayoutName !== 'eighthFloor') {
        const savedPositions = JSON.parse(savedLayoutJSON) as StoredPatientPosition[];
        const positionMap = new Map(savedPositions.map(p => [p.id, { gridRow: p.gridRow, gridColumn: p.gridColumn }]));

        finalPatientsData = basePatients.map(p => {
          const savedPos = positionMap.get(p.id);
          return savedPos ? { ...p, ...savedPos } : { ...p };
        });

      } else {
        finalPatientsData = applyLayout(currentLayoutName, basePatients);
        if (currentLayoutName !== 'eighthFloor') {
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

  const isEffectivelyLocked = currentLayoutName === 'eighthFloor' || isLayoutLocked;

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


  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    const savedLayout = localStorage.getItem('lastSelectedLayoutName') as LayoutName | null;
    if (savedLayout && appLayouts[savedLayout]) {
      setCurrentLayoutName(savedLayout);
    } else if (savedLayout && !appLayouts[savedLayout]) {
      console.warn(`Saved layout "${savedLayout}" not found. Falling back to default.`);
      setCurrentLayoutName('default');
      localStorage.removeItem('lastSelectedLayoutName');
    }

    const userLock = localStorage.getItem('userLayoutLockState') === 'true';
    setIsLayoutLocked(userLock);
  }, []);

  const handleSelectLayout = (newLayoutName: LayoutName) => {
    setCurrentLayoutName(newLayoutName);
    localStorage.setItem('lastSelectedLayoutName', newLayoutName);
  };

  const toggleLayoutLock = () => {
    if (currentLayoutName === 'eighthFloor') return;

    setIsLayoutLocked(prev => {
      const newLockState = !prev;
      localStorage.setItem('userLayoutLockState', String(newLockState));
      return newLockState;
    });
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handleDragStart = useCallback((
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
  }, [isEffectivelyLocked]);

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

  const handleDragEnd = useCallback(() => {
    setDraggingPatientInfo(null);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        subtitle="48 Bed Unit Patient Dashboard"
        isLayoutLocked={isEffectivelyLocked}
        onToggleLayoutLock={toggleLayoutLock}
        currentLayoutName={currentLayoutName}
        onSelectLayout={handleSelectLayout}
        availableLayouts={Object.keys(appLayouts) as LayoutName[]}
        onPrint={handlePrint}
      />
      <main className="flex-grow flex flex-col overflow-auto print-hide">
        <PatientGrid
          patients={patients}
          isInitialized={isInitialized}
          isEffectivelyLocked={isEffectivelyLocked}
          draggingPatientInfo={draggingPatientInfo}
          onSelectPatient={setSelectedPatient}
          onDragStart={handleDragStart}
          onDropOnCell={handleDropOnCell}
          onDragEnd={handleDragEnd}
        />
      </main>
      <PrintableReport patients={patients} />
      <ReportSheet
        patient={selectedPatient}
        open={!!selectedPatient}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedPatient(null);
          }
        }}
      />
      <footer className="text-center p-4 text-sm text-muted-foreground border-t print-hide">
        UnitView &copy; {currentYear !== null ? currentYear : 'Loading...'}
      </footer>
    </div>
  );
}
