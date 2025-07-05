
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';
import ReportSheet from '@/components/report-sheet';
import PrintableReport from '@/components/printable-report';
import SaveLayoutDialog from '@/components/save-layout-dialog';
import AdmitPatientDialog, { type AdmitPatientFormValues } from '@/components/admit-patient-dialog';
import DischargeConfirmationDialog from '@/components/discharge-confirmation-dialog';
import { layouts as appLayouts } from '@/lib/layouts';
import type { LayoutName } from '@/types/patient';
import type { Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';
import { generateInitialPatients } from '@/lib/initial-patients';
import { generateInitialNurses } from '@/lib/initial-nurses';
import { useToast } from "@/hooks/use-toast";

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
  const [availableLayouts, setAvailableLayouts] = useState<LayoutName[]>(Object.keys(appLayouts) as LayoutName[]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isAdmitDialogOpen, setIsAdmitDialogOpen] = useState(false);
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);


  const getFriendlyLayoutName = useCallback((layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'default': return 'Default Layout';
      case 'eighthFloor': return '8th Floor';
      case 'tenthFloor': return '10th Floor';
      default: return layoutName;
    }
  }, []);

  const applyLayout = useCallback((layoutKey: LayoutName, base: Patient[]): Patient[] => {
    if (appLayouts && typeof appLayouts === 'object' && appLayouts[layoutKey] && typeof appLayouts[layoutKey] === 'function') {
      return appLayouts[layoutKey](base);
    }
    console.warn(
      `Layout function for "${layoutKey}" not found. This is expected for custom layouts which are loaded from storage.`,
    );
    // For custom layouts, return base patients; the positions will be applied from localStorage.
    return [...base.map(p => ({ ...p }))];
  }, []);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setNurses(generateInitialNurses());

    const savedLayout = localStorage.getItem('lastSelectedLayoutName') as LayoutName | null;

    try {
        const customLayoutNames = JSON.parse(localStorage.getItem('customLayoutNames') || '[]') as string[];
        const allNames = [...Object.keys(appLayouts), ...customLayoutNames];
        const uniqueNames = Array.from(new Set(allNames));
        setAvailableLayouts(uniqueNames);
        
        if (savedLayout && uniqueNames.includes(savedLayout)) {
            setCurrentLayoutName(savedLayout);
        } else if (savedLayout) {
             console.warn(`Saved layout "${savedLayout}" not found. Falling back to default.`);
             setCurrentLayoutName('default');
             localStorage.removeItem('lastSelectedLayoutName');
        }
    } catch (error) {
        console.error("Failed to load custom layouts:", error);
        setAvailableLayouts(Object.keys(appLayouts) as LayoutName[]);
    }

    const userLock = localStorage.getItem('userLayoutLockState') === 'true';
    setIsLayoutLocked(userLock);
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
      if (savedLayoutJSON) {
        const savedPositions = JSON.parse(savedLayoutJSON) as StoredPatientPosition[];
        const positionMap = new Map(savedPositions.map(p => [p.id, { gridRow: p.gridRow, gridColumn: p.gridColumn }]));

        finalPatientsData = basePatients.map(p => {
          const savedPos = positionMap.get(p.id);
          return savedPos ? { ...p, ...savedPos } : { ...p };
        });

      } else {
        finalPatientsData = applyLayout(currentLayoutName, basePatients);
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
  }, [currentLayoutName, applyLayout]);

  const isEffectivelyLocked = isLayoutLocked;

  const handleSelectLayout = (newLayoutName: LayoutName) => {
    setCurrentLayoutName(newLayoutName);
    localStorage.setItem('lastSelectedLayoutName', newLayoutName);
  };

  const toggleLayoutLock = () => {
    setIsLayoutLocked(prev => {
      const newLockState = !prev;
      localStorage.setItem('userLayoutLockState', String(newLockState));
      return newLockState;
    });
  };
  
  const handleOpenSaveDialog = () => {
    if (isEffectivelyLocked) {
      toast({
        variant: "destructive",
        title: "Layout Locked",
        description: "Unlock the layout to save changes.",
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };
  
  const handleSaveNewLayout = (newLayoutName: string) => {
    const layoutStorageKey = `patientGridLayout_${newLayoutName}`;
    try {
      const positionsToSave: StoredPatientPosition[] = patients.map(p => ({
        id: p.id,
        gridRow: p.gridRow,
        gridColumn: p.gridColumn,
      }));
      localStorage.setItem(layoutStorageKey, JSON.stringify(positionsToSave));

      const customLayoutNames = JSON.parse(localStorage.getItem('customLayoutNames') || '[]') as string[];
      const updatedCustomLayouts = Array.from(new Set([...customLayoutNames, newLayoutName]));
      localStorage.setItem('customLayoutNames', JSON.stringify(updatedCustomLayouts));
      
      setAvailableLayouts(Array.from(new Set([...Object.keys(appLayouts), ...updatedCustomLayouts])));
      setCurrentLayoutName(newLayoutName);
      localStorage.setItem('lastSelectedLayoutName', newLayoutName);
      
      toast({
        title: "Layout Saved",
        description: `Layout "${newLayoutName}" has been successfully saved.`,
      });
    } catch (error) {
      console.error(`Error saving new layout ${newLayoutName}:`, error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Could not save the new layout. Please try again.",
      });
    }
  };

  const handleSaveAdmittedPatient = (formData: AdmitPatientFormValues) => {
    setPatients(prevPatients =>
      prevPatients.map(p => {
        if (p.bedNumber === formData.bedNumber) {
          // Overwrite patient data, but keep persistent grid position and ID
          return {
            ...p,
            name: formData.name,
            age: formData.age,
            gender: formData.gender,
            assignedNurse: formData.assignedNurse,
            chiefComplaint: formData.chiefComplaint,
            admitDate: formData.admitDate,
            dischargeDate: formData.dischargeDate,
            ldas: formData.ldas ? formData.ldas.split(',').map(s => s.trim()).filter(Boolean) : [],
            diet: formData.diet,
            mobility: formData.mobility,
            codeStatus: formData.codeStatus,
            isFallRisk: formData.isFallRisk,
            isSeizureRisk: formData.isSeizureRisk,
            isAspirationRisk: formData.isAspirationRisk,
            isIsolation: formData.isIsolation,
            isInRestraints: formData.isInRestraints,
            isComfortCareDNR: formData.isComfortCareDNR,
            notes: '', // Reset notes for new patient
          };
        }
        return p;
      })
    );
    setIsAdmitDialogOpen(false);
    toast({
      title: "Patient Admitted",
      description: `${formData.name} has been admitted to Bed ${formData.bedNumber}.`,
    });
  };

  const handleDischargePatient = () => {
    if (!patientToDischarge) return;

    const vacantPatient: Patient = {
      ...patientToDischarge,
      name: 'Vacant',
      age: 0,
      gender: undefined,
      admitDate: new Date(),
      dischargeDate: new Date(),
      chiefComplaint: 'N/A',
      ldas: [],
      diet: 'N/A',
      mobility: 'Independent',
      codeStatus: 'Full Code',
      assignedNurse: undefined,
      isFallRisk: false,
      isSeizureRisk: false,
      isAspirationRisk: false,
      isIsolation: false,
      isInRestraints: false,
      isComfortCareDNR: false,
      notes: '',
    };
    
    setPatients(prev => prev.map(p => (p.id === patientToDischarge.id ? vacantPatient : p)));

    toast({
      title: "Patient Discharged",
      description: `${patientToDischarge.name} has been discharged from Bed ${patientToDischarge.bedNumber}.`,
    });

    setPatientToDischarge(null);
    setSelectedPatient(null);
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

  const handleAutoSave = useCallback(() => {
    if (isEffectivelyLocked) return;
    
    const layoutStorageKey = `patientGridLayout_${currentLayoutName}`;
    try {
      const positionsToSave: StoredPatientPosition[] = patients.map(p => ({
        id: p.id,
        gridRow: p.gridRow,
        gridColumn: p.gridColumn,
      }));
      localStorage.setItem(layoutStorageKey, JSON.stringify(positionsToSave));
    } catch (error) {
      console.error(`Error auto-saving layout ${currentLayoutName}:`, error);
    }
  }, [patients, isEffectivelyLocked, currentLayoutName]);

  const handleDropOnNurseSlot = useCallback((targetNurseId: string, slotIndex: number) => {
    if (!draggingPatientInfo) return;
    const { id: draggedPatientId } = draggingPatientInfo;

    let newPatients = [...patients];
    let newNurses = [...nurses];
    
    const draggedPatient = newPatients.find(p => p.id === draggedPatientId);
    const targetNurse = newNurses.find(n => n.id === targetNurseId);

    if (!draggedPatient || !targetNurse) return;

    // 1. Unassign the dragged patient from any previous nurse
    newNurses = newNurses.map(nurse => ({
        ...nurse,
        assignedPatientIds: nurse.assignedPatientIds.map(id => (id === draggedPatientId ? null : id))
    }));

    // 2. Unassign any patient currently in the target slot
    const oldPatientIdInSlot = targetNurse.assignedPatientIds[slotIndex];
    if (oldPatientIdInSlot) {
        newPatients = newPatients.map(p => p.id === oldPatientIdInSlot ? { ...p, assignedNurse: undefined } : p);
    }
    
    // 3. Make the new assignment
    newNurses = newNurses.map(nurse => {
        if (nurse.id === targetNurseId) {
            const newAssignments = [...nurse.assignedPatientIds];
            newAssignments[slotIndex] = draggedPatientId;
            return { ...nurse, assignedPatientIds: newAssignments };
        }
        return nurse;
    });

    newPatients = newPatients.map(p => {
        if (p.id === draggedPatientId) {
            return { ...p, assignedNurse: targetNurse.name };
        }
        return p;
    });

    setNurses(newNurses);
    setPatients(newPatients);
    setDraggingPatientInfo(null);
  }, [draggingPatientInfo, patients, nurses]);

  const handleClearNurseAssignments = useCallback((nurseId: string) => {
    let newPatients = [...patients];
    let newNurses = [...nurses];

    const nurseToClear = newNurses.find(n => n.id === nurseId);
    if (!nurseToClear) return;
    
    const patientIdsToClear = nurseToClear.assignedPatientIds.filter(id => id !== null);
    
    newPatients = newPatients.map(p => {
        if (patientIdsToClear.includes(p.id)) {
            return { ...p, assignedNurse: undefined };
        }
        return p;
    });

    newNurses = newNurses.map(n => {
        if (n.id === nurseId) {
            return { ...n, assignedPatientIds: Array(6).fill(null) };
        }
        return n;
    });
    
    setNurses(newNurses);
    setPatients(newPatients);
  }, [patients, nurses]);


  useEffect(() => {
    if (isInitialized && !isEffectivelyLocked) {
      handleAutoSave();
    }
  }, [patients, isInitialized, isEffectivelyLocked, handleAutoSave]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        subtitle="48 Bed Unit Patient Dashboard"
        isLayoutLocked={isEffectivelyLocked}
        onToggleLayoutLock={toggleLayoutLock}
        currentLayoutName={currentLayoutName}
        onSelectLayout={handleSelectLayout}
        availableLayouts={availableLayouts}
        onPrint={handlePrint}
        onSaveLayout={handleOpenSaveDialog}
        onAdmitPatient={() => setIsAdmitDialogOpen(true)}
      />
      <main className="flex-grow flex flex-col overflow-auto print-hide">
        <PatientGrid
          patients={patients}
          nurses={nurses}
          isInitialized={isInitialized}
          isEffectivelyLocked={isEffectivelyLocked}
          draggingPatientInfo={draggingPatientInfo}
          onSelectPatient={setSelectedPatient}
          onDragStart={handleDragStart}
          onDropOnCell={handleDropOnCell}
          onDropOnNurseSlot={handleDropOnNurseSlot}
          onClearNurseAssignments={handleClearNurseAssignments}
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
        onDischarge={(patient) => setPatientToDischarge(patient)}
      />
      <SaveLayoutDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveNewLayout}
        existingLayoutNames={availableLayouts}
      />
      <AdmitPatientDialog
        open={isAdmitDialogOpen}
        onOpenChange={setIsAdmitDialogOpen}
        onSave={handleSaveAdmittedPatient}
        patients={patients}
      />
      <DischargeConfirmationDialog
        open={!!patientToDischarge}
        onOpenChange={(isOpen) => !isOpen && setPatientToDischarge(null)}
        patient={patientToDischarge}
        onConfirm={handleDischargePatient}
      />
      <footer className="text-center p-4 text-sm text-muted-foreground border-t print-hide">
        UnitView &copy; {currentYear !== null ? currentYear : 'Loading...'}
      </footer>
    </div>
  );
}
