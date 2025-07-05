
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus } from 'lucide-react';

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

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  relief: z.string().optional(),
});

export type AddNurseFormValues = z.infer<typeof formSchema>;

interface AddNurseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddNurseFormValues) => void;
}

export default function AddNurseDialog({ open, onOpenChange, onSave }: AddNurseDialogProps) {
  const form = useForm<AddNurseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      relief: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (values: AddNurseFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Nurse</DialogTitle>
          <DialogDescription>
            Enter the nurse's details. An available Spectra number will be assigned automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="e.g., RN Jane Smith" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
             <FormField control={form.control} name="relief" render={({ field }) => (
              <FormItem>
                <FormLabel>Relief Nurse (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., RN John Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Nurse
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
