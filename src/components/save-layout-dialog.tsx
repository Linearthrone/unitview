
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

interface SaveLayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  existingLayoutNames: string[];
}

export default function SaveLayoutDialog({ open, onOpenChange, onSave, existingLayoutNames }: SaveLayoutDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Layout name cannot be empty.');
      return;
    }
    if (existingLayoutNames.map(n => n.toLowerCase()).includes(trimmedName.toLowerCase())) {
        setError('A layout with this name already exists.');
        return;
    }
    if (trimmedName.includes('/')) {
        setError('Layout name cannot contain slashes (/).');
        return;
    }
    onSave(trimmedName);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Current Layout</DialogTitle>
          <DialogDescription>
            Enter a unique name for the current grid layout. This will add it to the layout selection dropdown.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="layout-name" className="text-right">
              Name
            </Label>
            <Input
              id="layout-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., ICU Pod A"
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
            Save Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
