
"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { AddStaffMemberFormSchema, type AddStaffMemberFormValues, STAFF_ROLES } from '@/types/forms';
import type { Nurse, PatientCareTech, Spectra } from '@/types/nurse';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AddStaffMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddStaffMemberFormValues) => void;
  spectraPool: Spectra[];
  nurses: Nurse[];
  techs: PatientCareTech[];
}

export default function AddStaffMemberDialog({ open, onOpenChange, onSave, spectraPool, nurses, techs }: AddStaffMemberDialogProps) {
  const form = useForm<AddStaffMemberFormValues>({
    resolver: zodResolver(AddStaffMemberFormSchema),
    defaultValues: {
      name: '',
      relief: '',
      role: 'Staff Nurse',
      spectra: '',
    },
  });

  const role = form.watch('role');

  const availableSpectra = useMemo(() => {
    const assignedSpectra = new Set([...nurses.map(n => n.spectra), ...techs.map(t => t.spectra)]);
    return spectraPool.filter(s => s.inService && !assignedSpectra.has(s.id));
  }, [spectraPool, nurses, techs]);

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);
  
  const showSpectraField = ['Staff Nurse', 'Float Pool Nurse', 'Patient Care Tech'].includes(role);

  const onSubmit = (values: AddStaffMemberFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Enter the staff member's details. For nursing roles, an available Spectra will be assigned.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="e.g., Jane Smith" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {STAFF_ROLES.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
             )} />
            {showSpectraField && (
              <FormField control={form.control} name="spectra" render={({ field }) => (
                <FormItem>
                  <FormLabel>Spectra Assignment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an available device" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSpectra.length > 0 ? (
                        availableSpectra.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.id}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No available Spectra devices</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}
             <FormField control={form.control} name="relief" render={({ field }) => (
              <FormItem>
                <FormLabel>Relief Staff (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
