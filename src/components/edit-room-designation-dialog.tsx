
"use client";

import React, { useState, useEffect } from 'react';
import type { Patient } from '@/types/patient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from 'lucide-react';

interface EditRoomDesignationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patientId: string, designation: string) => void;
  patient: Patient | null;
  existingDesignations: string[];
}

export default function EditRoomDesignationDialog({
  open,
  onOpenChange,
  onSave,
  patient,
  existingDesignations
}: EditRoomDesignationDialogProps) {
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && patient) {
      setDesignation(patient.roomDesignation);
      setError(null);
    }
  }, [open, patient]);

  if (!patient) return null;

  const handleSave = () => {
    const trimmedName = designation.trim();
    if (!trimmedName) {
      setError('Room designation cannot be empty.');
      return;
    }
    const otherDesignations = existingDesignations.filter(d => d.toLowerCase() !== patient.roomDesignation.toLowerCase());
    if (otherDesignations.map(d => d.toLowerCase()).includes(trimmedName.toLowerCase())) {
        setError('A room with this designation already exists.');
        return;
    }
    onSave(patient.id, trimmedName);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Room Designation</DialogTitle>
          <DialogDescription>
            Change the display name for {patient.roomDesignation}. Make it unique.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-designation-edit" className="text-right">
              Designation
            </Label>
            <Input
              id="room-designation-edit"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Room 101, Trauma 2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                }
              }}
            />
          </div>
           {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
             <Button type="button" variant="secondary">
                Cancel
             </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            <Edit className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
