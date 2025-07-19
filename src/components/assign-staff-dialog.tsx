
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from 'lucide-react';
import type { StaffRole } from '@/types/patient';

interface AssignStaffDialogProps {
  open: boolean;
  onOpenChange: () => void;
  role: StaffRole | null;
  onSave: (name: string, role: StaffRole) => void;
}

export default function AssignStaffDialog({ open, onOpenChange, role, onSave }: AssignStaffDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  if (!role) return null;

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Staff name cannot be empty.');
      return;
    }
    onSave(trimmedName, role);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign {role}</DialogTitle>
          <DialogDescription>
            Enter the name of the person to assign to this role.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="staff-name" className="text-right">
              Name
            </Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., John Smith"
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
          <Button type="button" variant="secondary" onClick={onOpenChange}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    