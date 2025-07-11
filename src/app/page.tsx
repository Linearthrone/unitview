
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
import CreateUnitDialog from '@/components/create-unit-dialog';
import EditRoomDesignationDialog from '@/components/edit-room-designation-dialog';
// Hooks and utils
import { useToast } from "@/hooks/use-toast";
import { NUM_ROWS_GRID, NUM_COLS_GRID } from '@/lib/grid-utils';
// Types
import type { LayoutName, Patient, WidgetCard } from '@/types/patient';
import type { Nurse, Spectra } from '@/types/nurse';
// Services
import * as layoutService from '@/services/layoutService';
import * as patientService from '@/services/patientService';
import * as nurseService from '@/services/nurseService';
import * as spectraService from '@/services/spectraService';
import { Stethoscope } from 'lucide-react';


interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}
interface DraggingNurseInfo {
  id: string;
}
interface DraggingWidgetInfo {
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
  const [widgetCards, setWidgetCards] = useState<WidgetCard[]>([
    { id: 'unit-clerk', type: 'UnitClerk', gridRow: 2, gridColumn: 8, width: 2, height: 1 },
    { id: 'charge-nurse', type: 'ChargeNurse', gridRow: 4, gridColumn: 8, width: 2, height: 1 },
  ]);
  
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [draggingNurseInfo, setDraggingNurseInfo] = useState<DraggingNurseInfo | null>(null);
  const [draggingWidgetInfo, setDraggingWidgetInfo] = useState<DraggingWidgetInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [admitOrUpdatePatient, setAdmitOrUpdatePatient] = useState<Patient | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isAddNurseDialogOpen, setIsAddNurseDialogOpen] = useState(false);
  const [isManageSpectraDialogOpen, setIsManageSpectraDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isCreateUnitDialogOpen, setIsCreateUnitDialogOpen] = useState(false);
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);
  const [patientToEditDesignation, setPatientToEditDesignation] = useState<Patient | null>(null);


  const loadLayoutData = useCallback(async (layoutName: LayoutName, currentSpectra: Spectra[]) => {
      setIsInitialized(false);
      try {
        const [patientData, nurseData, layoutWidgets] = await Promise.all([
            patientService.getPatients(layoutName),
            nurseService.getNurses(layoutName, currentSpectra),
            layoutService.getWidgets(layoutName),
        ]);

        const validNurses = nurseData.map(n => ({
          ...n,
          assignedPatientIds: Array.isArray(n.assignedPatientIds) ? n.assignedPatientIds : Array(6).fill(null)
        }));

        setPatients(patientData);
        setNurses(validNurses);
        if (layoutWidgets) {
            setWidgetCards(layoutWidgets);
        }
        setCurrentLayoutName(layoutName);
      } catch (error) {
        console.error(`Failed to load data for layout "${layoutName}":`, error);
        toast({
          variant: "destructive",
          title: "Error Loading Layout",
          description: `Could not load data for "${layoutName}".`,
        });
      } finally {
        setIsInitialized(true);
      }
  }, [toast]);

  // Initial setup on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setCurrentYear(new Date().getFullYear());
        
        const [lockState, initialSpectra, allLayouts, savedLayout] = await Promise.all([
          layoutService.getUserLayoutLockState(),
          spectraService.getSpectraPool(),
          layoutService.getAvailableLayouts(),
          layoutService.getLastSelectedLayout()
        ]);
        
        setIsLayoutLocked(lockState);
        setSpectraPool(initialSpectra);
        setAvailableLayouts(allLayouts);

        const layoutToLoad = (savedLayout && allLayouts.includes(savedLayout)) ? savedLayout : '*: North South';
        
        await loadLayoutData(layoutToLoad, initialSpectra);

      } catch (error) {
          console.error("Initialization failed:", error);
          toast({
              variant: "destructive",
              title: "Initialization Failed",
              description: "Could not load essential app configuration. Please try again.",
          });
          // Still set initialized to true on failure to unblock the UI
          setIsInitialized(true);
      }
    };
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleSelectLayout = async (newLayoutName: LayoutName) => {
    await layoutService.setLastSelectedLayout(newLayoutName);
    await loadLayoutData(newLayoutName, spectraPool);
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
  
  const handleSaveNewLayout = async (newLayoutName: string) => {
    const updatedLayouts = await layoutService.saveNewLayout(newLayoutName, patients, nurses, widgetCards);
    setAvailableLayouts(updatedLayouts);
    await handleSelectLayout(newLayoutName);
    
    toast({
      title: "Layout Saved",
      description: `Layout "${newLayoutName}" has been successfully saved.`,
    });
  };

  const handleOpenAdmitDialog = (patient: Patient) => {
    setIsUpdateMode(false);
    setAdmitOrUpdatePatient(patient);
  };

  const handleOpenUpdateDialog = (patient: Patient) => {
    setIsUpdateMode(true);
    setAdmitOrUpdatePatient(patient);
  };

  const handleSavePatient = (formData: AdmitPatientFormValues) => {
    const updatedPatients = patientService.admitPatient(formData, patients);
    setPatients(updatedPatients);
    setAdmitOrUpdatePatient(null);
    
    const verb = isUpdateMode ? 'updated' : 'admitted';
    const patientRecord = updatedPatients.find(p => p.bedNumber === formData.bedNumber);
    toast({
      title: `Patient ${verb.charAt(0).toUpperCase() + verb.slice(1)}`,
      description: `${formData.name} has been ${verb} to ${patientRecord?.roomDesignation}.`,
    });
  };

  const handleDischargeRequest = (patient: Patient) => {
    if (patient.name === 'Vacant') return;
    setPatientToDischarge(patient);
  };
  
  const handleConfirmDischarge = () => {
    if (!patientToDischarge) return;
    setPatients(patientService.dischargePatient(patientToDischarge, patients));
    toast({
      title: "Patient Discharged",
      description: `${patientToDischarge.name} has been discharged from ${patientToDischarge.roomDesignation}.`,
    });
    setPatientToDischarge(null);
    setSelectedPatient(null);
  };

  const handleToggleBlockRoom = (patientId: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, isBlocked: !p.isBlocked } : p
    ));
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        toast({
            title: `Room ${!patient.isBlocked ? "Blocked" : "Unblocked"}`,
            description: `${patient.roomDesignation} is now ${!patient.isBlocked ? "out of service" : "in service"}.`,
        });
    }
  };
  
  const handleSaveRoomDesignation = (patientId: string, newDesignation: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, roomDesignation: newDesignation } : p
    ));
    setPatientToEditDesignation(null);
    toast({
      title: "Room Designation Updated",
      description: `Room has been renamed to "${newDesignation}".`,
    });
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
  
  const handleAddSpectra = async (newId: string) => {
    const result = await spectraService.addSpectra(newId, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: "Spectra Added", description: `Device ${newId.trim().toUpperCase()} added to the pool.` });
    } else if (result.error) {
      toast({ variant: "destructive", title: "Error Adding Spectra", description: result.error });
    }
  };
  
  const handleToggleSpectraStatus = async (id: string, inService: boolean) => {
    const result = await spectraService.toggleSpectraStatus(id, inService, spectraPool, nurses);
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

  const handleCreateUnit = async ({ designation, numRooms }: { designation: string; numRooms: number }) => {
    try {
        const updatedLayouts = await layoutService.createNewUnitLayout(designation, numRooms);
        setAvailableLayouts(updatedLayouts);
        // After creating the unit, select it, which will trigger a full data reload and handle the loading state.
        await handleSelectLayout(designation); 
        toast({
            title: "Unit Created",
            description: `Unit "${designation}" with ${numRooms} rooms has been created.`,
        });
    } catch (error) {
        console.error("Failed to create new unit:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Error Creating Unit",
            description: errorMessage,
        });
        throw error; // Re-throw the error so the dialog can catch it
    }
  };

  const handleInsertMockData = () => {
    const { updatedPatients, insertedCount } = patientService.insertMockPatients(patients);
    if (insertedCount > 0) {
      setPatients(updatedPatients);
      toast({
        title: "Mock Data Inserted",
        description: `${insertedCount} mock patients have been added to vacant rooms.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "No Vacant Rooms",
        description: "Could not insert mock data because there are no available vacant rooms.",
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
    setDraggingWidgetInfo(null);
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
    setDraggingWidgetInfo(null);
    setDraggingNurseInfo({ id: nurseId });
    e.dataTransfer.setData('text/plain', nurseId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);

  const handleWidgetDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
    if (isLayoutLocked) {
        e.preventDefault();
        return;
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingWidgetInfo({ id: widgetId });
    e.dataTransfer.setData('text/plain', widgetId);
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

    if (draggingWidgetInfo) {
      const { id: draggedWidgetId } = draggingWidgetInfo;
      setWidgetCards(prevWidgets => {
          const newWidgets = prevWidgets.map(w => ({ ...w }));
          const draggedWidget = newWidgets.find(w => w.id === draggedWidgetId);
          if (!draggedWidget) return prevWidgets;
  
          // Check for conflicts
          const isOccupiedByPatient = patients.some(p => p.gridRow === targetRow && p.gridColumn === targetCol);
          if (isOccupiedByPatient) {
              toast({ variant: "destructive", title: "Cannot Move Widget", description: "The target location is occupied by a patient." });
              return prevWidgets;
          }
  
          draggedWidget.gridRow = targetRow;
          draggedWidget.gridColumn = targetCol;
          return newWidgets;
      });
  }

    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingWidgetInfo(null);
  }, [draggingPatientInfo, draggingNurseInfo, draggingWidgetInfo, isLayoutLocked, patients, nurses, toast]);
  
  const handleDragEnd = useCallback(() => {
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingWidgetInfo(null);
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (isLayoutLocked || !isInitialized) return;
    await Promise.all([
      patientService.savePatients(currentLayoutName, patients),
      nurseService.saveNurses(currentLayoutName, nurses),
      layoutService.saveWidgets(currentLayoutName, widgetCards),
    ]);
  }, [patients, nurses, widgetCards, isLayoutLocked, currentLayoutName, isInitialized]);

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
  }, [patients, nurses, widgetCards, isInitialized, isLayoutLocked, handleAutoSave]);
    
  const getFriendlyLayoutName = useCallback((layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'default': return 'Default Layout';
      case '*: North South': return 'North/South View';
      default: return layoutName;
    }
  }, []);

  const activePatientCount = patients.filter(p => p.name !== 'Vacant').length;
  const totalRoomCount = patients.length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        activePatientCount={activePatientCount}
        totalRoomCount={totalRoomCount}
        isLayoutLocked={isLayoutLocked}
        onToggleLayoutLock={toggleLayoutLock}
        currentLayoutName={currentLayoutName}
        onSelectLayout={handleSelectLayout}
        availableLayouts={availableLayouts}
        onPrint={handlePrint}
        onSaveLayout={handleOpenSaveDialog}
        onAdmitPatient={() => handleOpenAdmitDialog(null)}
        onAddNurse={() => setIsAddNurseDialogOpen(true)}
        onManageSpectra={() => setIsManageSpectraDialogOpen(true)}
        onAddRoom={() => setIsAddRoomDialogOpen(true)}
        onCreateUnit={() => setIsCreateUnitDialogOpen(true)}
        onInsertMockData={handleInsertMockData}
      />
      <main className="flex-grow flex flex-col overflow-auto print-hide">
        <PatientGrid
          patients={patients}
          nurses={nurses}
          widgetCards={widgetCards}
          isInitialized={isInitialized}
          isEffectivelyLocked={isLayoutLocked}
          draggingPatientInfo={draggingPatientInfo}
          draggingNurseInfo={draggingNurseInfo}
          draggingWidgetInfo={draggingWidgetInfo}
          onSelectPatient={setSelectedPatient}
          onPatientDragStart={handlePatientDragStart}
          onNurseDragStart={handleNurseDragStart}
          onWidgetDragStart={handleWidgetDragStart}
          onDropOnCell={handleDropOnCell}
          onDropOnNurseSlot={handleDropOnNurseSlot}
          onClearNurseAssignments={handleClearNurseAssignments}
          onDragEnd={handleDragEnd}
          onAdmitPatient={handleOpenAdmitDialog}
          onUpdatePatient={handleOpenUpdateDialog}
          onDischargePatient={handleDischargeRequest}
          onToggleBlockRoom={handleToggleBlockRoom}
          onEditDesignation={(patient) => setPatientToEditDesignation(patient)}
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
        onDischarge={handleDischargeRequest}
      />
      <SaveLayoutDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveNewLayout}
        existingLayoutNames={availableLayouts}
      />
      <AdmitPatientDialog
        open={!!admitOrUpdatePatient}
        onOpenChange={(isOpen) => !isOpen && setAdmitOrUpdatePatient(null)}
        onSave={handleSavePatient}
        patients={patients}
        nurses={nurses}
        patientToEdit={admitOrUpdatePatient}
        isUpdateMode={isUpdateMode}
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
      <CreateUnitDialog
        open={isCreateUnitDialogOpen}
        onOpenChange={setIsCreateUnitDialogOpen}
        onSave={handleCreateUnit}
        existingLayoutNames={availableLayouts}
      />
       <EditRoomDesignationDialog
        open={!!patientToEditDesignation}
        onOpenChange={(isOpen) => !isOpen && setPatientToEditDesignation(null)}
        patient={patientToEditDesignation}
        onSave={handleSaveRoomDesignation}
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
        onConfirm={handleConfirmDischarge}
      />
      <footer className="text-center p-4 text-sm text-muted-foreground border-t print-hide">
        UnitView &copy; {currentYear !== null ? currentYear : 'Loading...'}
      </footer>
    </div>
  );
}
