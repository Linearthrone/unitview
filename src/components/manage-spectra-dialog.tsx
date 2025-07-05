
"use client";

import React, { useState } from 'react';
import type { Spectra } from '@/types/nurse';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManageSpectraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spectraPool: Spectra[];
  onAddSpectra: (id: string) => void;
  onToggleStatus: (id: string, inService: boolean) => void;
}

export default function ManageSpectraDialog({
  open,
  onOpenChange,
  spectraPool,
  onAddSpectra,
  onToggleStatus,
}: ManageSpectraDialogProps) {
  const [newSpectraId, setNewSpectraId] = useState('');

  const handleAdd = () => {
    // Validation is now handled by the parent service, just pass the value up.
    onAddSpectra(newSpectraId);
    setNewSpectraId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Spectra Pool</DialogTitle>
          <DialogDescription>
            Add new Spectra devices and toggle their service status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Input
            id="new-spectra"
            placeholder="e.g., SPEC-0000"
            value={newSpectraId}
            onChange={(e) => setNewSpectraId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button type="button" onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>

        <Separator />
        
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-4">
            {spectraPool.map((spectra) => (
              <div key={spectra.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   {spectra.inService 
                     ? <CheckCircle className="h-5 w-5 text-green-500" />
                     : <XCircle className="h-5 w-5 text-red-500" />
                   }
                   <Label htmlFor={`switch-${spectra.id}`} className="font-medium text-base">
                     {spectra.id}
                   </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={cn("text-sm", spectra.inService ? "text-green-600" : "text-red-600")}>
                        {spectra.inService ? 'In Service' : 'Out of Service'}
                    </span>
                    <Switch
                        id={`switch-${spectra.id}`}
                        checked={spectra.inService}
                        onCheckedChange={(checked) => onToggleStatus(spectra.id, checked)}
                    />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
