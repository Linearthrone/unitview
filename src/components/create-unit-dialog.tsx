
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
import { Building2 } from 'lucide-react';

interface CreateUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { designation: string; numRooms: number }) => void;
  existingLayoutNames: string[];
}

export default function CreateUnitDialog({ open, onOpenChange, onSave, existingLayoutNames }: CreateUnitDialogProps) {
  const [designation, setDesignation] = useState('');
  const [numRooms, setNumRooms] = useState(24);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDesignation('');
      setNumRooms(24);
      setError(null);
    }
  }, [open]);

  const handleSave = () => {
    const trimmedDesignation = designation.trim();
    if (!trimmedDesignation) {
      setError('Unit designation cannot be empty.');
      return;
    }
    if (existingLayoutNames.map(d => d.toLowerCase()).includes(trimmedDesignation.toLowerCase())) {
        setError('A layout with this designation already exists.');
        return;
    }
    if (numRooms <= 0) {
        setError('Number of rooms must be greater than zero.');
        return;
    }

    onSave({ designation: trimmedDesignation, numRooms });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Unit</DialogTitle>
          <DialogDescription>
            Enter a unique designation to create a new unit layout. Rooms will be automatically generated and placed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="unit-designation">Unit Designation / Name</Label>
            <Input
              id="unit-designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g., 8th Floor, 10C, West Wing"
            />
             {error && <p className="text-sm text-destructive pt-1">{error}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="num-rooms">Number of Rooms</Label>
            <Input
              id="num-rooms"
              type="number"
              value={numRooms}
              onChange={(e) => setNumRooms(parseInt(e.target.value, 10) || 0)}
              placeholder="e.g., 24"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
             <Button type="button" variant="secondary">
                Cancel
             </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            <Building2 className="mr-2 h-4 w-4" />
            Create Unit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
