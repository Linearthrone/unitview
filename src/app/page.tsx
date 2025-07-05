
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';
import ReportSheet from '@/components/report-sheet';
import PrintableReport from '@/components/printable-report';
import SaveLayoutDialog from '@/components/save-layout-dialog';
import AdmitPatientDialog, { type AdmitPatientFormValues } from '@/components/admit-patient-dialog';
import DischargeConfirmationDialog from '@/components/discharge-confirmation-dialog';
import AddNurseDialog, { type AddNurseFormValues } from '@/components/add-nurse-dialog';
import ManageSpectraDialog from '@/components/manage-spectra-dialog';
import { layouts as appLayouts } from '@/lib/layouts';
import type { LayoutName } from '@/types/patient';
import type { Patient } from '@/types/patient';
import type { Nurse, Spectra } from '@/types/nurse';
import { generateInitialPatients } from '@/lib/initial-patients';
import { generateInitialNurses } from '@/lib/initial-nurses';
import { generateInitialSpectra } from '@/lib/initial-spectra';
import { useToast } from "@/hooks/use-toast";
import { NUM_ROWS_GRID, NUM_COLS_GRID } from '@/lib/grid-utils';

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
interface DraggingNurseInfo {
  id: string;
}

export default function Home() {
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<LayoutName>('default');
  const [availableLayouts, setAvailableLayouts] = useState<LayoutName[]>(Object.keys(appLayouts) as LayoutName[]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [spectraPool, setSpectraPool] = useState<Spectra[]>([]);
  
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [draggingNurseInfo, setDraggingNurseInfo] = useState<DraggingNurseInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isAdmitDialogOpen, setIsAdmitDialogOpen] = useState(false);
  const [isAddNurseDialogOpen, setIsAddNurseDialogOpen] = useState(false);
  const [isManageSpectraDialogOpen, setIsManageSpectraDialogOpen] = useState(false);
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
    
    // Load Spectra Pool
    try {
      const savedSpectra = localStorage.getItem('spectraPool');
      if (savedSpectra) {
        setSpectraPool(JSON.parse(savedSpectra));
      } else {
        const initialSpectra = generateInitialSpectra();
        setSpectraPool(initialSpectra);
        localStorage.setItem('spectraPool', JSON.stringify(initialSpectra));
      }
    } catch (error) {
      console.error("Failed to load spectra pool:", error);
      setSpectraPool(generateInitialSpectra());
    }

  }, []);

  useEffect(() => {
    if (!currentLayoutName || spectraPool.length === 0) {
        return;
    }
    
    // Load Patients
    const basePatients = generateInitialPatients();
    const patientLayoutStorageKey = `patientGridLayout_${currentLayoutName}`;
    let finalPatientsData: Patient[];

    try {
      const savedLayoutJSON = localStorage.getItem(patientLayoutStorageKey);
      if (savedLayoutJSON) {
        const savedPositions = JSON.parse(savedLayoutJSON) as StoredPatientPosition[];
        const positionMap = new Map(savedPositions.map(p => [p.id, { gridRow: p.gridRow, gridColumn: p.gridColumn }]));
        finalPatientsData = basePatients.map(p => {
          const savedPos = positionMap.get(p.id);
          return savedPos ? { ...p, ...savedPos } : { ...p };
        });
      } else {
        finalPatientsData = applyLayout(currentLayoutName, basePatients);
      }
    } catch (error) {
      console.error(`Error processing patient layout ${currentLayoutName} from localStorage:`, error);
      finalPatientsData = applyLayout(currentLayoutName, basePatients);
    }
    setPatients(finalPatientsData);

    // Load Nurses
    const nurseLayoutStorageKey = `nurseGridLayout_${currentLayoutName}`;
    try {
      const savedNurseLayoutJSON = localStorage.getItem(nurseLayoutStorageKey);
      if (savedNurseLayoutJSON) {
        const savedNurses = JSON.parse(savedNurseLayoutJSON) as Partial<Nurse>[];
        // Validate and provide defaults for nurses loaded from storage
        const validatedNurses = savedNurses.map(nurse => ({
            id: nurse.id || `nurse-${Date.now()}`,
            name: nurse.name || 'Unnamed',
            relief: nurse.relief || '',
            spectra: nurse.spectra || 'N/A',
            gridRow: nurse.gridRow || 1,
            gridColumn: nurse.gridColumn || 1,
            // Ensure assignedPatientIds is always an array to prevent crashes from old data.
            assignedPatientIds: nurse.assignedPatientIds && Array.isArray(nurse.assignedPatientIds) 
                                ? nurse.assignedPatientIds 
                                : Array(6).fill(null),
        })) as Nurse[];
        setNurses(validatedNurses);
      } else {
        const initialNurses = generateInitialNurses();
        const availableSpectra = spectraPool.filter(s => s.inService);
        const nursesWithSpectra = initialNurses.map((nurse, index) => ({
          ...nurse,
          spectra: availableSpectra[index]?.id || 'N/A',
        }));
        setNurses(nursesWithSpectra as Nurse[]);
      }
    } catch (error) {
        console.error(`Error processing nurse layout ${currentLayoutName} from localStorage:`, error);
        const initialNurses = generateInitialNurses();
        const availableSpectra = spectraPool.filter(s => s.inService);
        const nursesWithSpectra = initialNurses.map((nurse, index) => ({
          ...nurse,
          spectra: availableSpectra[index]?.id || 'N/A',
        }));
        setNurses(nursesWithSpectra as Nurse[]);
    }

    setIsInitialized(true);
  }, [currentLayoutName, applyLayout, spectraPool.length]);

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
    const patientLayoutStorageKey = `patientGridLayout_${newLayoutName}`;
    const nurseLayoutStorageKey = `nurseGridLayout_${newLayoutName}`;
    try {
      const patientPositionsToSave: StoredPatientPosition[] = patients.map(p => ({ id: p.id, gridRow: p.gridRow, gridColumn: p.gridColumn }));
      localStorage.setItem(patientLayoutStorageKey, JSON.stringify(patientPositionsToSave));
      
      localStorage.setItem(nurseLayoutStorageKey, JSON.stringify(nurses));

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
            notes: '',
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
  
  const findEmptySlotForNurse = (): { row: number; col: number } | null => {
    const occupiedCells = new Set<string>();
    patients.forEach(p => {
        occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
    });
    nurses.forEach(n => {
        for (let i = 0; i < 3; i++) {
            occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
        }
    });

    for (let c = 1; c <= NUM_COLS_GRID; c++) {
      for (let r = 1; r <= NUM_ROWS_GRID - 2; r++) {
        if (
          !occupiedCells.has(`${r}-${c}`) &&
          !occupiedCells.has(`${r + 1}-${c}`) &&
          !occupiedCells.has(`${r + 2}-${c}`)
        ) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  const handleSaveNurse = (formData: AddNurseFormValues) => {
    const assignedSpectra = spectraPool.find(s => s.inService && !nurses.some(n => n.spectra === s.id));
    if (!assignedSpectra) {
      toast({
        variant: "destructive",
        title: "No Spectra Available",
        description: "Could not add nurse. Please add or enable a Spectra device in the pool.",
      });
      return;
    }
    
    const position = findEmptySlotForNurse();
    if (!position) {
      toast({
        variant: "destructive",
        title: "No Space Available",
        description: "Cannot add new nurse, the grid is full.",
      });
      return;
    }

    const newNurse: Nurse = {
      id: `nurse-${Date.now()}`,
      name: formData.name,
      relief: formData.relief,
      spectra: assignedSpectra.id,
      assignedPatientIds: Array(6).fill(null),
      gridRow: position.row,
      gridColumn: position.col,
    };
    
    setNurses(prev => [...prev, newNurse]);
    setIsAddNurseDialogOpen(false);
    toast({
      title: "Nurse Added",
      description: `${formData.name} has been added to the unit.`,
    });
  };
  
  const handleAddSpectra = (newId: string) => {
    setSpectraPool(prev => {
        const newPool = [...prev, { id: newId, inService: true }];
        localStorage.setItem('spectraPool', JSON.stringify(newPool));
        return newPool;
    });
    toast({ title: "Spectra Added", description: `Device ${newId} added to the pool.` });
  };
  
  const handleToggleSpectraStatus = (id: string, inService: boolean) => {
    if (!inService && nurses.some(n => n.spectra === id)) {
        toast({ variant: "destructive", title: "Cannot Disable", description: "This Spectra is currently assigned to a nurse." });
        return;
    }
    setSpectraPool(prev => {
        const newPool = prev.map(s => s.id === id ? { ...s, inService } : s);
        localStorage.setItem('spectraPool', JSON.stringify(newPool));
        return newPool;
    });
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handlePatientDragStart = useCallback((
    e: React.DragEvent<HTMLDivElement>,
    patientId: string,
    originalGridRow: number,
    originalGridColumn: number
  ) => {
    if (isEffectivelyLocked) {
      e.preventDefault();
      return;
    }
    setDraggingNurseInfo(null);
    setDraggingPatientInfo({ id: patientId, originalGridRow, originalGridColumn });
    e.dataTransfer.setData('text/plain', patientId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isEffectivelyLocked]);
  
  const handleNurseDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, nurseId: string) => {
    if (isEffectivelyLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo({ id: nurseId });
    e.dataTransfer.setData('text/plain', nurseId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isEffectivelyLocked]);


  const handleDropOnCell = useCallback((targetRow: number, targetCol: number) => {
    if (isEffectivelyLocked) return;

    if (draggingPatientInfo) {
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
    }

    if (draggingNurseInfo) {
      const { id: draggedNurseId } = draggingNurseInfo;
      setNurses(prevNurses => {
        const newNurses = prevNurses.map(n => ({ ...n }));
        const draggedNurse = newNurses.find(n => n.id === draggedNurseId);
        if (!draggedNurse) return prevNurses;

        const newRow = Math.min(targetRow, NUM_ROWS_GRID - 2); 

        const targetCells = [`${newRow}-${targetCol}`, `${newRow + 1}-${targetCol}`, `${newRow + 2}-${targetCol}`];
        const isOccupiedByPatient = patients.some(p => targetCells.includes(`${p.gridRow}-${p.gridColumn}`));
        const isOccupiedByOtherNurse = newNurses.some(nurse => {
          if (nurse.id === draggedNurseId) return false;
          if (nurse.gridColumn !== targetCol) return false;
          const nurseTop = nurse.gridRow;
          const nurseBottom = nurse.gridRow + 2;
          return newRow <= nurseBottom && (newRow + 2) >= nurseTop;
        });

        if (isOccupiedByPatient || isOccupiedByOtherNurse) {
          toast({ variant: "destructive", title: "Cannot Move Nurse", description: "The target location is occupied." });
          return prevNurses;
        }

        draggedNurse.gridRow = newRow;
        draggedNurse.gridColumn = targetCol;
        return newNurses;
      });
    }

    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
  }, [draggingPatientInfo, draggingNurseInfo, isEffectivelyLocked, patients, toast]);
  
  const handleDragEnd = useCallback(() => {
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
  }, []);

  const handleAutoSave = useCallback(() => {
    if (isEffectivelyLocked || !isInitialized) return;
    
    const patientLayoutStorageKey = `patientGridLayout_${currentLayoutName}`;
    try {
      const positionsToSave: StoredPatientPosition[] = patients.map(p => ({ id: p.id, gridRow: p.gridRow, gridColumn: p.gridColumn }));
      localStorage.setItem(patientLayoutStorageKey, JSON.stringify(positionsToSave));
    } catch (error) {
      console.error(`Error auto-saving patient layout ${currentLayoutName}:`, error);
    }
    
    const nurseLayoutStorageKey = `nurseGridLayout_${currentLayoutName}`;
    try {
      localStorage.setItem(nurseLayoutStorageKey, JSON.stringify(nurses));
    } catch (error) {
      console.error(`Error auto-saving nurse layout ${currentLayoutName}:`, error);
    }

  }, [patients, nurses, isEffectivelyLocked, currentLayoutName, isInitialized]);

  const handleDropOnNurseSlot = useCallback((targetNurseId: string, slotIndex: number) => {
    if (!draggingPatientInfo) return;
    const { id: draggedPatientId } = draggingPatientInfo;

    let newPatients = [...patients];
    let newNurses = [...nurses];
    
    const draggedPatient = newPatients.find(p => p.id === draggedPatientId);
    const targetNurse = newNurses.find(n => n.id === targetNurseId);

    if (!draggedPatient || !targetNurse) return;

    newNurses = newNurses.map(nurse => ({
        ...nurse,
        assignedPatientIds: nurse.assignedPatientIds.map(id => (id === draggedPatientId ? null : id))
    }));

    const oldPatientIdInSlot = targetNurse.assignedPatientIds[slotIndex];
    if (oldPatientIdInSlot) {
        newPatients = newPatients.map(p => p.id === oldPatientIdInSlot ? { ...p, assignedNurse: undefined } : p);
    }
    
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
  }, [patients, nurses, isInitialized, isEffectivelyLocked, handleAutoSave]);

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
        onAddNurse={() => setIsAddNurseDialogOpen(true)}
        onManageSpectra={() => setIsManageSpectraDialogOpen(true)}
      />
      <main className="flex-grow flex flex-col overflow-auto print-hide">
        <PatientGrid
          patients={patients}
          nurses={nurses}
          isInitialized={isInitialized}
          isEffectivelyLocked={isEffectivelyLocked}
          draggingPatientInfo={draggingPatientInfo}
          draggingNurseInfo={draggingNurseInfo}
          onSelectPatient={setSelectedPatient}
          onPatientDragStart={handlePatientDragStart}
          onNurseDragStart={handleNurseDragStart}
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
        nurses={nurses}
      />
      <AddNurseDialog
        open={isAddNurseDialogOpen}
        onOpenChange={setIsAddNurseDialogOpen}
        onSave={handleSaveNurse}
      />
      <ManageSpectraDialog
        open={isManageSpectraDialogOpen}
        onOpenChange={setIsManageSpectraDialogOpen}
        spectraPool={spectraPool}
        onAddSpectra={handleAddSpectra}
        onToggleStatus={handleToggleSpectraStatus}
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
