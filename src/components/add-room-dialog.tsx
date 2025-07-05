
"use client";

import React, { useState, useEffect } from 'react';
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
import { PlusSquare } from 'lucide-react';

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (designation: string) => void;
  existingDesignations: string[];
}

export default function AddRoomDialog({ open, onOpenChange, onSave, existingDesignations }: AddRoomDialogProps) {
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDesignation('');
      setError(null);
    }
  }, [open]);

  const handleSave = () => {
    const trimmedName = designation.trim();
    if (!trimmedName) {
      setError('Room designation cannot be empty.');
      return;
    }
    if (existingDesignations.map(d => d.toLowerCase()).includes(trimmedName.toLowerCase())) {
        setError('A room with this designation already exists.');
        return;
    }
    onSave(trimmedName);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Enter a unique designation for the new room card. It will be added to the grid as a vacant room.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-designation" className="text-right">
              Designation
            </Label>
            <Input
              id="room-designation"
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
            <PlusSquare className="mr-2 h-4 w-4" />
            Create Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
