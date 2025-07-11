
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
import AddStaffMemberDialog, { type AddStaffMemberFormValues } from '@/components/add-staff-member-dialog';
import ManageSpectraDialog from '@/components/manage-spectra-dialog';
import AddRoomDialog from '@/components/add-room-dialog';
import CreateUnitDialog from '@/components/create-unit-dialog';
import EditRoomDesignationDialog from '@/components/edit-room-designation-dialog';
// Hooks and utils
import { useToast } from "@/hooks/use-toast";
import { NUM_ROWS_GRID, NUM_COLS_GRID } from '@/lib/grid-utils';
// Types
import type { LayoutName, Patient, WidgetCard } from '@/types/patient';
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';
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
interface DraggingTechInfo {
  id: string;
}

export default function Home() {
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<LayoutName>('default');
  const [availableLayouts, setAvailableLayouts] = useState<LayoutName[]>([]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [techs, setTechs] = useState<PatientCareTech[]>([]);
  const [spectraPool, setSpectraPool] = useState<Spectra[]>([]);
  const [widgetCards, setWidgetCards] = useState<WidgetCard[]>([
    { id: 'unit-clerk', type: 'UnitClerk', gridRow: 2, gridColumn: 8, width: 2, height: 1 },
    { id: 'charge-nurse', type: 'ChargeNurse', gridRow: 4, gridColumn: 8, width: 2, height: 1 },
  ]);
  
  const [chargeNurseName, setChargeNurseName] = useState<string>('Unassigned');
  const [unitClerkName, setUnitClerkName] = useState<string>('Unassigned');

  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [draggingNurseInfo, setDraggingNurseInfo] = useState<DraggingNurseInfo | null>(null);
  const [draggingWidgetInfo, setDraggingWidgetInfo] = useState<DraggingWidgetInfo | null>(null);
  const [draggingTechInfo, setDraggingTechInfo] = useState<DraggingTechInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [admitOrUpdatePatient, setAdmitOrUpdatePatient] = useState<Patient | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isAddStaffMemberDialogOpen, setIsAddStaffMemberDialogOpen] = useState(false);
  const [isManageSpectraDialogOpen, setIsManageSpectraDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isCreateUnitDialogOpen, setIsCreateUnitDialogOpen] = useState(false);
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);
  const [patientToEditDesignation, setPatientToEditDesignation] = useState<Patient | null>(null);


  const loadLayoutData = useCallback(async (layoutName: LayoutName, currentSpectra: Spectra[]) => {
      setIsInitialized(false);
      try {
        const [patientData, nurseData, techData, layoutWidgets, staffData] = await Promise.all([
            patientService.getPatients(layoutName),
            nurseService.getNurses(layoutName, currentSpectra),
            nurseService.getTechs(layoutName, currentSpectra),
            layoutService.getWidgets(layoutName),
            layoutService.getStaff(layoutName),
        ]);

        const validNurses = nurseData.map(n => ({
          ...n,
          assignedPatientIds: Array.isArray(n.assignedPatientIds) ? n.assignedPatientIds : Array(6).fill(null)
        }));

        setPatients(patientData);
        setNurses(validNurses);
        setTechs(techData);
        if (layoutWidgets) {
            setWidgetCards(layoutWidgets);
        }
        if (staffData) {
            setChargeNurseName(staffData.chargeNurseName || 'Unassigned');
            setUnitClerkName(staffData.unitClerkName || 'Unassigned');
        } else {
            setChargeNurseName('Unassigned');
            setUnitClerkName('Unassigned');
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
    const staffData = { chargeNurseName, unitClerkName };
    const updatedLayouts = await layoutService.saveNewLayout(newLayoutName, patients, nurses, techs, widgetCards, staffData);
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

  
  const handleSaveStaffMember = (formData: AddStaffMemberFormValues) => {
    const result = nurseService.addStaffMember(formData, nurses, techs, patients, spectraPool, widgetCards);
    
    setIsAddStaffMemberDialogOpen(false);

    if (result.newNurses) {
        setNurses(result.newNurses);
        toast({ title: "Nurse Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
    } else if (result.newTechs) {
        setTechs(result.newTechs);
        toast({ title: "Tech Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
    } else if (result.chargeNurseName) {
        setChargeNurseName(result.chargeNurseName);
        toast({ title: "Charge Nurse Assigned", description: `${formData.name} is now the Charge Nurse.` });
    } else if (result.unitClerkName) {
        setUnitClerkName(result.unitClerkName);
        toast({ title: "Unit Clerk Assigned", description: `${formData.name} is now the Unit Clerk.` });
    } else if (result.success) {
        toast({ title: "Staff Member Added", description: `${formData.name} (${formData.role}) has been added.` });
    } else if (result.error) {
        toast({
            variant: "destructive",
            title: result.error === "No Spectra Available" ? "No Spectra Available" : "No Space Available",
            description: result.error,
        });
    }
  };

  const handleRemoveNurse = (nurseId: string) => {
    const nurseToRemove = nurses.find(n => n.id === nurseId);
    if (!nurseToRemove) return;

    // Unassign patients from the nurse being removed
    const patientIdsToUnassign = nurseToRemove.assignedPatientIds.filter(id => id !== null);
    setPatients(prevPatients =>
      prevPatients.map(p =>
        patientIdsToUnassign.includes(p.id) ? { ...p, assignedNurse: undefined } : p
      )
    );

    setNurses(prevNurses => prevNurses.filter(n => n.id !== nurseId));
    toast({
      title: "Nurse Removed",
      description: `${nurseToRemove.name} has been removed from the unit.`,
    });
  };

  const handleRemoveTech = (techId: string) => {
    const techToRemove = techs.find(t => t.id === techId);
    if (!techToRemove) return;

    setTechs(prevTechs => prevTechs.filter(t => t.id !== techId));
    toast({
      title: "Tech Removed",
      description: `${techToRemove.name} has been removed from the unit.`,
    });
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
    const result = await spectraService.toggleSpectraStatus(id, inService, spectraPool, nurses, techs);
    if (result.newPool) {
        setSpectraPool(result.newPool);
    } else if (result.error) {
        toast({ variant: "destructive", title: "Cannot Disable", description: result.error });
    }
  };

  const handleCreateRoom = (designation: string) => {
    const result = patientService.createRoom(designation, patients, nurses, techs, widgetCards);
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
    setDraggingTechInfo(null);
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
    setDraggingTechInfo(null);
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
    setDraggingTechInfo(null);
    setDraggingWidgetInfo({ id: widgetId });
    e.dataTransfer.setData('text/plain', widgetId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);

  const handleTechDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, techId: string) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingWidgetInfo(null);
    setDraggingTechInfo({ id: techId });
    e.dataTransfer.setData('text/plain', techId);
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

    if (draggingTechInfo) {
        const { id: draggedTechId } = draggingTechInfo;
        setTechs(prevTechs => {
            const newTechs = prevTechs.map(t => ({...t}));
            const draggedTech = newTechs.find(t => t.id === draggedTechId);
            if (!draggedTech) return prevTechs;

            // Check for conflicts
            const isOccupiedByPatient = patients.some(p => p.gridRow === targetRow && p.gridColumn === targetCol);
            if (isOccupiedByPatient) {
                toast({ variant: "destructive", title: "Cannot Move Tech", description: "The target location is occupied by a patient." });
                return prevTechs;
            }
    
            draggedTech.gridRow = targetRow;
            draggedTech.gridColumn = targetCol;
            return newTechs;
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
    setDraggingTechInfo(null);
  }, [draggingPatientInfo, draggingNurseInfo, draggingWidgetInfo, draggingTechInfo, isLayoutLocked, patients, toast]);
  
  const handleDragEnd = useCallback(() => {
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingWidgetInfo(null);
    setDraggingTechInfo(null);
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (isLayoutLocked || !isInitialized) return;
    const staffData = { chargeNurseName, unitClerkName };
    await Promise.all([
      patientService.savePatients(currentLayoutName, patients),
      nurseService.saveNurses(currentLayoutName, nurses),
      nurseService.saveTechs(currentLayoutName, techs),
      layoutService.saveWidgets(currentLayoutName, widgetCards),
      layoutService.saveStaff(currentLayoutName, staffData),
    ]);
  }, [patients, nurses, techs, widgetCards, isLayoutLocked, currentLayoutName, isInitialized, chargeNurseName, unitClerkName]);

  const handleDropOnNurseSlot = useCallback((targetNurseId: string, slotIndex: number) => {
    if (!draggingPatientInfo) return;
    const { id: draggedPatientId } = draggingPatientInfo;

    // Use functional updates to ensure we have the latest state
    setPatients(currentPatients => {
      setNurses(currentNurses => {
        const draggedPatient = currentPatients.find(p => p.id === draggedPatientId);
        const targetNurse = currentNurses.find(n => n.id === targetNurseId);

        if (!draggedPatient || !targetNurse) {
          return currentNurses; // No change if patient or nurse not found
        }
        
        // 1. Get the list of all patients currently assigned to the target nurse
        const currentAssignedIds = targetNurse.assignedPatientIds.filter(id => id !== null && id !== draggedPatientId);
        
        // 2. Add the newly dragged patient to this list
        const newAssignedIds = [...currentAssignedIds, draggedPatientId];

        // 3. Create a map of patients for easy lookup
        const patientMap = new Map(currentPatients.map(p => [p.id, p]));

        // 4. Sort the assigned IDs based on the patient's bed number
        const sortedPatientIds = newAssignedIds.sort((idA, idB) => {
          const patientA = patientMap.get(idA);
          const patientB = patientMap.get(idB);
          if (!patientA || !patientB) return 0;
          return patientA.bedNumber - patientB.bedNumber;
        });

        // 5. Pad the array with nulls to fill all 6 slots
        const finalPaddedIds = Array(6).fill(null);
        sortedPatientIds.forEach((id, index) => {
          if (index < 6) {
            finalPaddedIds[index] = id;
          }
        });

        // 6. Update all nurses: remove the dragged patient from any other nurse and update the target nurse
        const newNurses = currentNurses.map(nurse => {
          if (nurse.id === targetNurseId) {
            return { ...nurse, assignedPatientIds: finalPaddedIds };
          }
          // Remove the patient from any other nurse who might have had them assigned
          const updatedIds = nurse.assignedPatientIds.map(id => (id === draggedPatientId ? null : id));
          return { ...nurse, assignedPatientIds: updatedIds };
        });

        // 7. Update all patients to reflect their new nurse assignment
        const newPatients = currentPatients.map(p => {
          if (finalPaddedIds.includes(p.id)) {
            return { ...p, assignedNurse: targetNurse.name };
          }
          if (p.assignedNurse === targetNurse.name && !finalPaddedIds.includes(p.id)) {
            return { ...p, assignedNurse: undefined };
          }
          return p;
        });
        
        // Set the new state for patients first, then nurses
        setPatients(newPatients);
        return newNurses;
      });
      return currentPatients; // Return original patients for this updater, the inner one handles it
    });

    setDraggingPatientInfo(null);
  }, [draggingPatientInfo]);

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
  }, [patients, nurses, techs, widgetCards, chargeNurseName, unitClerkName, isInitialized, isLayoutLocked, handleAutoSave]);

  useEffect(() => {
      if (techs.length > 0) {
          const updatedTechs = nurseService.calculateTechAssignments(techs, patients);
          // Only update state if assignments have actually changed to prevent infinite loops
          if (JSON.stringify(updatedTechs) !== JSON.stringify(techs)) {
              setTechs(updatedTechs);
          }
      }
  }, [patients, techs]);
    
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
        onAddStaffMember={() => setIsAddStaffMemberDialogOpen(true)}
        onManageSpectra={() => setIsManageSpectraDialogOpen(true)}
        onAddRoom={() => setIsAddRoomDialogOpen(true)}
        onCreateUnit={() => setIsCreateUnitDialogOpen(true)}
        onInsertMockData={handleInsertMockData}
      />
      <main className="flex-grow flex flex-col overflow-auto print-hide">
        <PatientGrid
          patients={patients}
          nurses={nurses}
          techs={techs}
          widgetCards={widgetCards}
          chargeNurseName={chargeNurseName}
          unitClerkName={unitClerkName}
          isInitialized={isInitialized}
          isEffectivelyLocked={isLayoutLocked}
          draggingPatientInfo={draggingPatientInfo}
          draggingNurseInfo={draggingNurseInfo}
          draggingTechInfo={draggingTechInfo}
          draggingWidgetInfo={draggingWidgetInfo}
          onSelectPatient={setSelectedPatient}
          onPatientDragStart={handlePatientDragStart}
          onNurseDragStart={handleNurseDragStart}
          onTechDragStart={handleTechDragStart}
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
          onRemoveNurse={handleRemoveNurse}
          onRemoveTech={handleRemoveTech}
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
      <AddStaffMemberDialog
        open={isAddStaffMemberDialogOpen}
        onOpenChange={setIsAddStaffMemberDialogOpen}
        onSave={handleSaveStaffMember}
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
