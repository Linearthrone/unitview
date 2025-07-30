
"use client";

import React, { useState, useEffect, useCallback } from 'react';
// UI Components
import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';
import ReportSheet from '@/components/report-sheet';
import PrintableReport from '@/components/printable-report';
import PrintableAssignments from '@/components/printable-assignments';
import DischargeConfirmationDialog from '@/components/discharge-confirmation-dialog';
import AddStaffMemberDialog, { type AddStaffMemberFormValues } from '@/components/add-staff-member-dialog';
import AddRoomDialog from '@/components/add-room-dialog';
import EditRoomDesignationDialog from '@/components/edit-room-designation-dialog';
import AssignStaffDialog from '@/components/assign-staff-dialog';
// Hooks and utils
import { useToast } from "@/hooks/use-toast";
import { NUM_ROWS_GRID, NUM_COLS_GRID } from '@/lib/grid-utils';
// Types
import type { LayoutName, Patient, WidgetCard, StaffRole } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
// Services
import * as layoutService from '@/services/layoutService';
import * as patientService from '@/services/patientService';
import * as nurseService from '@/services/nurseService';
import * as assignmentService from '@/services/assignmentService';


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

const SINGLE_LAYOUT_NAME: LayoutName = 'Unit';

export default function Home() {
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [techs, setTechs] = useState<PatientCareTech[]>([]);
  const [widgetCards, setWidgetCards] = useState<WidgetCard[]>([]);
  
  const [chargeNurseName, setChargeNurseName] = useState<string>('Unassigned');
  const [unitClerkName, setUnitClerkName] = useState<string>('Unassigned');

  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [draggingNurseInfo, setDraggingNurseInfo] = useState<DraggingNurseInfo | null>(null);
  const [draggingWidgetInfo, setDraggingWidgetInfo] = useState<DraggingWidgetInfo | null>(null);
  const [draggingTechInfo, setDraggingTechInfo] = useState<DraggingTechInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isAddStaffMemberDialogOpen, setIsAddStaffMemberDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);
  const [patientToEditDesignation, setPatientToEditDesignation] = useState<Patient | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<StaffRole | null>(null);


  const loadLayoutData = useCallback(async (layoutName: LayoutName) => {
      if (!layoutName) {
        throw new Error("loadLayoutData was called without a layoutName.");
      };
      setIsInitialized(false);
      try {
        const layoutData = await layoutService.getOrCreateLayout(layoutName);

        const validNurses = layoutData.nurses.map(n => ({
          ...n,
          assignedPatientIds: Array.isArray(n.assignedPatientIds) ? n.assignedPatientIds : Array(6).fill(null)
        }));

        setPatients(layoutData.patients);
        setNurses(validNurses);
        setTechs(layoutData.techs);
        setWidgetCards(layoutData.widgets);
        setChargeNurseName(layoutData.staff.chargeNurseName || 'Unassigned');
        setUnitClerkName(layoutData.staff.unitClerkName || 'Unassigned');

      } catch (error) {
        console.error(`Failed to load data for layout "${layoutName}":`, error);
        toast({
          variant: "destructive",
          title: "Error Loading Layout",
          description: `Could not load data for "${layoutName}". Please refresh.`,
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
        
        const userPrefs = await layoutService.getUserPreferences();
        
        setIsLayoutLocked(userPrefs.isLayoutLocked);
        await loadLayoutData(SINGLE_LAYOUT_NAME);

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

  const toggleLayoutLock = () => {
    const newLockState = !isLayoutLocked;
    setIsLayoutLocked(newLockState);
    layoutService.setUserPreference('isLayoutLocked', newLockState);
  };

  const handleSaveCurrentLayout = async () => {
    if (isLayoutLocked) {
      toast({
        variant: "destructive",
        title: "Layout Locked",
        description: "Unlock the layout to save changes.",
      });
      return;
    }
    const staffData = { chargeNurseName, unitClerkName };
    await layoutService.saveLayout(SINGLE_LAYOUT_NAME, patients, nurses, techs, widgetCards, staffData);
    toast({
      title: "Layout Saved",
      description: `Current layout has been saved.`,
    });
  };

  const handleSaveAssignments = async () => {
    try {
      await assignmentService.saveShiftAssignments(SINGLE_LAYOUT_NAME, nurses, patients, chargeNurseName);
      toast({
        title: "Assignments Saved",
        description: "The current shift assignments have been saved for reference.",
      });
    } catch (error) {
       console.error("Failed to save assignments:", error);
       toast({
          variant: "destructive",
          title: "Error Saving Assignments",
          description: "Could not save the current assignments. See console for details.",
       });
    }
  };

  const handleDischargeRequest = (patient: Patient) => {
    if (patient.name === 'Vacant') return;
    setPatientToDischarge(patient);
  };
  
  const handleConfirmDischarge = async () => {
    if (!patientToDischarge) return;
    const dischargedPatients = await patientService.dischargePatient(patientToDischarge, patients);
    setPatients(dischargedPatients);
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

  
  const handleSaveStaffMember = async (formData: AddStaffMemberFormValues) => {
    const result = await nurseService.addStaffMember(formData, nurses, techs, patients, widgetCards);
    
    setIsAddStaffMemberDialogOpen(false);

    if (result.newNurses) {
        setNurses(result.newNurses);
        toast({ title: "Staff Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
    } else if (result.newTechs) {
        setTechs(result.newTechs);
        toast({ title: "Tech Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
    } else if (result.success) {
        toast({ title: "Staff Member Added", description: `${formData.name} (${formData.role}) has been added.` });
    } else if (result.error) {
        toast({
            variant: "destructive",
            title: "Error Adding Staff",
            description: result.error,
        });
    }
  };

  const handleAssignSpecificRole = (name: string, role: StaffRole) => {
    if (role === 'Charge Nurse') {
      setChargeNurseName(name);
      toast({ title: "Charge Nurse Assigned", description: `${name} is now the Charge Nurse.` });
    } else if (role === 'Unit Clerk') {
      setUnitClerkName(name);
      toast({ title: "Unit Clerk Assigned", description: `${name} is now the Unit Clerk.` });
    }
    setRoleToAssign(null);
  };

  const handleRemoveSpecificRole = (role: StaffRole) => {
    if (role === 'Charge Nurse') {
      setChargeNurseName('Unassigned');
      toast({ title: "Charge Nurse Removed", description: `The Charge Nurse has been unassigned.` });
    } else if (role === 'Unit Clerk') {
      setUnitClerkName('Unassigned');
      toast({ title: "Unit Clerk Removed", description: `The Unit Clerk has been unassigned.` });
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
      title: "Staff Removed",
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

  const handleCreateRoom = async (designation: string) => {
    const result = await patientService.createRoom(designation, patients, nurses, techs, widgetCards);
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

  const handleInsertMockData = async () => {
    const { updatedPatients, insertedCount } = await patientService.insertMockPatients(patients);
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

  const handlePrint = (reportType: 'charge' | 'assignments') => {
    const printTarget = reportType === 'charge' ? 'printable-charge-report' : 'printable-assignments-report';
    const content = document.getElementById(printTarget);
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
        <html>
        <head>
          <title>Print Report</title>
          <style>
              @media print {
                  body { 
                      font-family: Arial, Helvetica, sans-serif;
                      font-size: 10pt;
                  }
                  .print-hide { display: none !important; }
                  .page-break-inside-avoid { page-break-inside: avoid; }
                  h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 0.5rem; }
                  .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; font-size: 9pt; }
                  .report-header .unit-name { font-size: 20pt; font-weight: bold; text-align: center; width: 100%; position: absolute; top: 0; left: 0; }
              }
          </style>
          <link rel="stylesheet" href="/globals.css">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body onload="window.print(); window.close();">
          ${content.innerHTML}
        </body>
        </html>
    `);
    printWindow?.document.close();
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
      patientService.savePatients(SINGLE_LAYOUT_NAME, patients),
      nurseService.saveNurses(SINGLE_LAYOUT_NAME, nurses),
      nurseService.saveTechs(SINGLE_LAYOUT_NAME, techs),
      layoutService.saveWidgets(SINGLE_LAYOUT_NAME, widgetCards),
      layoutService.saveStaff(SINGLE_LAYOUT_NAME, staffData),
    ]);
  }, [patients, nurses, techs, widgetCards, isLayoutLocked, isInitialized, chargeNurseName, unitClerkName]);

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
        const sortedPatientIds = newAssignedIds.sort((a, idB) => {
          const patientA = patientMap.get(a);
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
    const calculateAndSetAssignments = async () => {
        if (patients.length > 0 && techs.length > 0) {
            const updatedTechs = await nurseService.calculateTechAssignments(techs, patients);
            // Deep comparison to prevent unnecessary re-renders that cause loops
            if (JSON.stringify(updatedTechs) !== JSON.stringify(techs)) {
                setTechs(updatedTechs);
            }
        }
    };
    calculateAndSetAssignments();
}, [patients, techs]);
    
  const activePatientCount = patients.filter(p => p.name !== 'Vacant').length;
  const totalRoomCount = patients.length;
  const dnrCount = patients.filter(p => p.isComfortCareDNR).length;
  const restraintCount = patients.filter(p => p.isInRestraints).length;
  const foleyCount = patients.filter(p => Array.isArray(p.ldas) && p.ldas.some(lda => lda.toLowerCase().includes('foley'))).length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        activePatientCount={activePatientCount}
        totalRoomCount={totalRoomCount}
        isLayoutLocked={isLayoutLocked}
        dnrCount={dnrCount}
        restraintCount={restraintCount}
        foleyCount={foleyCount}
        onToggleLayoutLock={toggleLayoutLock}
        onPrint={handlePrint}
        onSaveCurrentLayout={handleSaveCurrentLayout}
        onAddStaffMember={() => setIsAddStaffMemberDialogOpen(true)}
        onAddRoom={() => setIsAddRoomDialogOpen(true)}
        onInsertMockData={handleInsertMockData}
        onSaveAssignments={handleSaveAssignments}
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
          onDischargePatient={handleDischargeRequest}
          onToggleBlockRoom={handleToggleBlockRoom}
          onEditDesignation={(patient) => setPatientToEditDesignation(patient)}
          onRemoveNurse={handleRemoveNurse}
          onRemoveTech={handleRemoveTech}
          onAssignRole={(role) => setRoleToAssign(role)}
          onRemoveRole={handleRemoveSpecificRole}
        />
      </main>
      <PrintableReport patients={patients} />
      <PrintableAssignments 
        unitName={SINGLE_LAYOUT_NAME}
        chargeNurseName={chargeNurseName}
        nurses={nurses}
        techs={techs}
        patients={patients}
      />
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
       <EditRoomDesignationDialog
        open={!!patientToEditDesignation}
        onOpenChange={(isOpen) => !isOpen && setPatientToEditDesignation(null)}
        patient={patientToEditDesignation}
        onSave={handleSaveRoomDesignation}
        existingDesignations={patients.map(p => p.roomDesignation)}
      />
      <DischargeConfirmationDialog
        open={!!patientToDischarge}
        onOpenChange={(isOpen) => !isOpen && setPatientToDischarge(null)}
        patient={patientToDischarge}
        onConfirm={handleConfirmDischarge}
      />
       <AssignStaffDialog
        open={!!roleToAssign}
        onOpenChange={() => setRoleToAssign(null)}
        role={roleToAssign}
        onSave={handleAssignSpecificRole}
      />
      <footer className="text-center p-4 text-sm text-muted-foreground border-t print-hide">
        UnitView &copy; {currentYear !== null ? currentYear : 'Loading...'}
      </footer>
    </div>
  );
}
