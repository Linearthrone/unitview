
"use client";

import React, { useState, useEffect, useCallback } from 'react';
// UI Components
import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';
import ReportSheet from '@/components/report-sheet';
import PrintableReport from '@/components/printable-report';
import SaveLayoutDialog from '@/components/save-layout-dialog';
import AdmitPatientDialog, { type AdmitPatientFormValues } from '@/components/admit-patient-dialog';
import DischargeConfirmationDialog from '@/components/discharge-confirmation-dialog';
import AddNurseDialog, { type AddNurseFormValues } from '@/components/add-nurse-dialog';
import ManageSpectraDialog from '@/components/manage-spectra-dialog';
import AddRoomDialog from '@/components/add-room-dialog';
// Hooks and utils
import { useToast } from "@/hooks/use-toast";
import { NUM_ROWS_GRID, NUM_COLS_GRID } from '@/lib/grid-utils';
// Types
import type { LayoutName, Patient } from '@/types/patient';
import type { Nurse, Spectra } from '@/types/nurse';
// Services
import * as layoutService from '@/services/layoutService';
import * as patientService from '@/services/patientService';
import * as nurseService from '@/services/nurseService';
import * as spectraService from '@/services/spectraService';


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
  const [availableLayouts, setAvailableLayouts] = useState<LayoutName[]>([]);

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
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);

  // Initial setup on mount
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    
    // Load initial state from services (which use localStorage)
    setIsLayoutLocked(layoutService.getUserLayoutLockState());
    setSpectraPool(spectraService.getSpectraPool());

    const allLayouts = layoutService.getAvailableLayouts();
    setAvailableLayouts(allLayouts);

    const savedLayout = layoutService.getLastSelectedLayout();
    if (savedLayout && allLayouts.includes(savedLayout)) {
        setCurrentLayoutName(savedLayout);
    } else {
        setCurrentLayoutName('default');
    }
  }, []);

  // Load patient and nurse data when layout or spectra pool changes
  useEffect(() => {
    if (!currentLayoutName || spectraPool.length === 0) {
        return;
    }
    
    setPatients(patientService.getPatients(currentLayoutName));
    setNurses(nurseService.getNurses(currentLayoutName, spectraPool));

    setIsInitialized(true);
  }, [currentLayoutName, spectraPool]);

  const handleSelectLayout = (newLayoutName: LayoutName) => {
    setCurrentLayoutName(newLayoutName);
    layoutService.setLastSelectedLayout(newLayoutName);
  };

  const toggleLayoutLock = () => {
    const newLockState = !isLayoutLocked;
    setIsLayoutLocked(newLockState);
    layoutService.setUserLayoutLockState(newLockState);
  };
  
  const handleOpenSaveDialog = () => {
    if (isLayoutLocked) {
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
    const updatedLayouts = layoutService.saveNewLayout(newLayoutName, patients, nurses);
    setAvailableLayouts(updatedLayouts);
    setCurrentLayoutName(newLayoutName);
    layoutService.setLastSelectedLayout(newLayoutName);
    
    toast({
      title: "Layout Saved",
      description: `Layout "${newLayoutName}" has been successfully saved.`,
    });
  };

  const handleSaveAdmittedPatient = (formData: AdmitPatientFormValues) => {
    const updatedPatients = patientService.admitPatient(formData, patients);
    setPatients(updatedPatients);
    setIsAdmitDialogOpen(false);
    
    const admittedToPatient = updatedPatients.find(p => p.bedNumber === formData.bedNumber);
    
    toast({
      title: "Patient Admitted",
      description: `${formData.name} has been admitted to ${admittedToPatient?.roomDesignation}.`,
    });
  };

  const handleDischargePatient = () => {
    if (!patientToDischarge) return;
    setPatients(patientService.dischargePatient(patientToDischarge, patients));
    toast({
      title: "Patient Discharged",
      description: `${patientToDischarge.name} has been discharged from ${patientToDischarge.roomDesignation}.`,
    });
    setPatientToDischarge(null);
    setSelectedPatient(null);
  };
  
  const handleSaveNurse = (formData: AddNurseFormValues) => {
    const result = nurseService.addNurse(formData, nurses, patients, spectraPool);
    if (result.newNurses) {
        setNurses(result.newNurses);
        setIsAddNurseDialogOpen(false);
        toast({
            title: "Nurse Added",
            description: `${formData.name} has been added to the unit.`,
        });
    } else {
        toast({
            variant: "destructive",
            title: result.error === "No Spectra Available" ? "No Spectra Available" : "No Space Available",
            description: result.error === "No Spectra Available" 
                ? "Could not add nurse. Please add or enable a Spectra device in the pool."
                : "Cannot add new nurse, the grid is full.",
        });
    }
  };
  
  const handleAddSpectra = (newId: string) => {
    const result = spectraService.addSpectra(newId, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: "Spectra Added", description: `Device ${newId.trim().toUpperCase()} added to the pool.` });
    } else if (result.error) {
      toast({ variant: "destructive", title: "Error Adding Spectra", description: result.error });
    }
  };
  
  const handleToggleSpectraStatus = (id: string, inService: boolean) => {
    const result = spectraService.toggleSpectraStatus(id, inService, spectraPool, nurses);
    if (result.newPool) {
        setSpectraPool(result.newPool);
    } else if (result.error) {
        toast({ variant: "destructive", title: "Cannot Disable", description: result.error });
    }
  };

  const handleCreateRoom = (designation: string) => {
    const result = patientService.createRoom(designation, patients, nurses);
    if (result.newPatients) {
      setPatients(result.newPatients);
      setIsAddRoomDialogOpen(false);
      toast({
        title: "Room Created",
        description: `Room "${designation}" has been added to the grid.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Could Not Create Room",
        description: result.error,
      });
    }
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
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingNurseInfo(null);
    setDraggingPatientInfo({ id: patientId, originalGridRow, originalGridColumn });
    e.dataTransfer.setData('text/plain', patientId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);
  
  const handleNurseDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, nurseId: string) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo({ id: nurseId });
    e.dataTransfer.setData('text/plain', nurseId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);


  const handleDropOnCell = useCallback((targetRow: number, targetCol: number) => {
    if (isLayoutLocked) return;

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
  }, [draggingPatientInfo, draggingNurseInfo, isLayoutLocked, patients, toast]);
  
  const handleDragEnd = useCallback(() => {
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
  }, []);

  const handleAutoSave = useCallback(() => {
    if (isLayoutLocked || !isInitialized) return;
    patientService.savePatients(currentLayoutName, patients);
    nurseService.saveNurses(currentLayoutName, nurses);
  }, [patients, nurses, isLayoutLocked, currentLayoutName, isInitialized]);

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
    if (isInitialized && !isLayoutLocked) {
      handleAutoSave();
    }
  }, [patients, nurses, isInitialized, isLayoutLocked, handleAutoSave]);
    
  const getFriendlyLayoutName = useCallback((layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'default': return 'Default Layout';
      case 'eighthFloor': return '8th Floor';
      case 'tenthFloor': return '10th Floor';
      default: return layoutName;
    }
  }, []);

  const activePatientCount = patients.filter(p => p.name !== 'Vacant').length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        activePatientCount={activePatientCount}
        isLayoutLocked={isLayoutLocked}
        onToggleLayoutLock={toggleLayoutLock}
        currentLayoutName={currentLayoutName}
        onSelectLayout={handleSelectLayout}
        availableLayouts={availableLayouts}
        onPrint={handlePrint}
        onSaveLayout={handleOpenSaveDialog}
        onAdmitPatient={() => setIsAdmitDialogOpen(true)}
        onAddNurse={() => setIsAddNurseDialogOpen(true)}
        onManageSpectra={() => setIsManageSpectraDialogOpen(true)}
        onAddRoom={() => setIsAddRoomDialogOpen(true)}
      />
      <main className="flex-grow flex flex-col overflow-auto print-hide">
        <PatientGrid
          patients={patients}
          nurses={nurses}
          isInitialized={isInitialized}
          isEffectivelyLocked={isLayoutLocked}
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
      <AddRoomDialog
        open={isAddRoomDialogOpen}
        onOpenChange={setIsAddRoomDialogOpen}
        onSave={handleCreateRoom}
        existingDesignations={patients.map(p => p.roomDesignation)}
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
