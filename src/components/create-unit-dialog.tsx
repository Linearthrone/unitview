
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle } from 'lucide-react';
import { CreateUnitFormSchema, type CreateUnitFormValues } from '@/types/forms';

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

interface CreateUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateUnitFormValues) => void;
  existingLayouts: string[];
}

export default function CreateUnitDialog({ open, onOpenChange, onSave, existingLayouts }: CreateUnitDialogProps) {
  const form = useForm<CreateUnitFormValues>({
    resolver: zodResolver(CreateUnitFormSchema(existingLayouts)),
    defaultValues: {
      designation: '',
      roomCount: 40,
      startNumber: 801,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (values: CreateUnitFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Unit Layout</DialogTitle>
          <DialogDescription>
            Define the properties for a new unit layout.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="designation" render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Designation</FormLabel>
                <FormControl><Input placeholder="e.g., Medical ICU" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="roomCount" render={({ field }) => (
                <FormItem>
                    <FormLabel>Number of Rooms</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 40" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
             )} />
             <FormField control={form.control} name="startNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Starting Room Number</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 801" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Unit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
