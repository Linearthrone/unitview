"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { Patient } from '@/types/patient';
import PatientBlock from './patient-block';
import { generateInitialPatients } from '@/lib/initial-patients';
import { cn } from '@/lib/utils';

const PatientGrid: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [draggingPatientId, setDraggingPatientId] = useState<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    setPatients(generateInitialPatients().sort((a, b) => a.order - b.order));
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, patientId: string) => {
    setDraggingPatientId(patientId);
    // For Firefox compatibility
    e.dataTransfer.setData('text/plain', patientId); 
    // Give visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('opacity-50');
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetPatientId: string) => {
    e.preventDefault();
    dragOverItem.current = targetPatientId;
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggingPatientId || !dragOverItem.current || draggingPatientId === dragOverItem.current) {
      setDraggingPatientId(null);
      dragOverItem.current = null;
      // Clean up any residual opacity styles from all items
      document.querySelectorAll('[data-patient-id]').forEach(el => el.classList.remove('opacity-50'));
      return;
    }

    const draggedPatientIndex = patients.findIndex(p => p.id === draggingPatientId);
    const targetPatientIndex = patients.findIndex(p => p.id === dragOverItem.current);

    if (draggedPatientIndex === -1 || targetPatientIndex === -1) return;

    setPatients(prevPatients => {
      const newPatients = [...prevPatients];
      const [draggedItem] = newPatients.splice(draggedPatientIndex, 1);
      newPatients.splice(targetPatientIndex, 0, draggedItem);
      // Update order property for persistence if needed, for now just re-index
      return newPatients.map((p, index) => ({ ...p, order: index }));
    });

    setDraggingPatientId(null);
    dragOverItem.current = null;
    // Clean up any residual opacity styles from all items
    document.querySelectorAll('[data-patient-id]').forEach(el => el.classList.remove('opacity-50'));
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingPatientId(null);
    dragOverItem.current = null;
    // Clean up visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('opacity-50');
    }
     // Clean up any residual opacity styles from all items in case drop didn't occur on a valid target
    document.querySelectorAll('[data-patient-id]').forEach(el => el.classList.remove('opacity-50'));
  };


  if (patients.length === 0) {
    return <div className="text-center p-8">Loading patient data...</div>;
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop} // Add onDrop to the grid container
    >
      {patients.map((patient) => (
        <div
          key={patient.id}
          draggable
          onDragStart={(e) => handleDragStart(e, patient.id)}
          onDragEnter={(e) => handleDragEnter(e, patient.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "cursor-grab transition-opacity duration-150",
            draggingPatientId === patient.id && "opacity-50"
          )}
          data-patient-id={patient.id} // To help identify the element
        >
          <PatientBlock patient={patient} isDragging={draggingPatientId === patient.id} />
        </div>
      ))}
    </div>
  );
};

export default PatientGrid;
