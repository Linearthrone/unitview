
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from "date-fns";
import { CalendarIcon, UserPlus, Edit } from 'lucide-react';
import type { Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';
import { AdmitPatientFormSchema, type AdmitPatientFormValues, MOBILITY_STATUSES, GENDERS, CODE_STATUSES, DIETS, ORIENTATION_STATUSES } from '@/types/forms';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AdmitPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AdmitPatientFormValues) => void;
  patients: Patient[];
  nurses: Nurse[];
  patientToEdit: Patient | null;
  isUpdateMode: boolean;
}

export default function AdmitPatientDialog({
  open,
  onOpenChange,
  onSave,
  patients,
  nurses,
  patientToEdit,
  isUpdateMode,
}: AdmitPatientDialogProps) {
  const form = useForm<AdmitPatientFormValues>({
    resolver: zodResolver(AdmitPatientFormSchema),
    defaultValues: {
      admitDate: new Date(),
      dischargeDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      assignedNurse: 'To Be Assigned',
      orientationStatus: 'x4',
      ldas: '',
      notes: '',
      isFallRisk: false,
      isSeizureRisk: false,
      isAspirationRisk: false,
      isIsolation: false,
      isInRestraints: false,
      isComfortCareDNR: false,
    },
  });

  const availableNurses = React.useMemo(() => {
    return ['To Be Assigned', ...nurses.map(n => n.name)];
  }, [nurses]);

  useEffect(() => {
    if (open && patientToEdit) {
      if (isUpdateMode) {
        // Update mode: populate form with existing patient data
        form.reset({
          ...patientToEdit,
          ldas: Array.isArray(patientToEdit.ldas) ? patientToEdit.ldas.join(', ') : '',
          assignedNurse: patientToEdit.assignedNurse || 'To Be Assigned',
        });
      } else {
        // Admit mode into a specific (vacant) bed
        form.reset({
          bedNumber: patientToEdit.bedNumber,
          admitDate: new Date(),
          dischargeDate: new Date(new Date().setDate(new Date().getDate() + 3)),
          assignedNurse: 'To Be Assigned',
          orientationStatus: 'x4',
        });
      }
    } else if (open && !patientToEdit) {
        // Admit mode into any bed
        form.reset({
            admitDate: new Date(),
            dischargeDate: new Date(new Date().setDate(new Date().getDate() + 3)),
            assignedNurse: 'To Be Assigned',
            orientationStatus: 'x4',
        });
    }
  }, [open, patientToEdit, isUpdateMode, form]);

  const onSubmit = (values: AdmitPatientFormValues) => {
    onSave(values);
  };
  
  const vacantBedNumbers = patients
    .filter(p => p.name === 'Vacant' && !p.isBlocked)
    .map(p => p.bedNumber)
    .sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isUpdateMode ? `Update Patient: ${patientToEdit?.name}` : 'Admit / Transfer-In Patient'}</DialogTitle>
          <DialogDescription>
            {isUpdateMode 
              ? `Update the information for the patient in ${patientToEdit?.roomDesignation}.`
              : 'Fill out the form to admit a new patient to a vacant bed.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-6 p-1">

                <section>
                  <h3 className="text-lg font-medium mb-2">Patient & Bed</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl><Input type="number" placeholder="65" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bedNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bed Number</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}
                          disabled={isUpdateMode}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a vacant bed" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isUpdateMode && patientToEdit && (
                               <SelectItem key={patientToEdit.bedNumber} value={patientToEdit.bedNumber.toString()}>
                                 {patientToEdit.roomDesignation} (Bed {patientToEdit.bedNumber})
                               </SelectItem>
                            )}
                            {!isUpdateMode && vacantBedNumbers.map(bed => {
                              const patientInBed = patients.find(p => p.bedNumber === bed);
                              return (
                                <SelectItem key={bed} value={bed.toString()}>
                                  {patientInBed?.roomDesignation} (Bed {bed})
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                     <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                           <FormLabel>Gender</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl><SelectTrigger><SelectValue placeholder="Select gender"/></SelectTrigger></FormControl>
                             <SelectContent>
                               {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                             </SelectContent>
                           </Select>
                           <FormMessage/>
                        </FormItem>
                     )}/>
                     <FormField
                        control={form.control}
                        name="assignedNurse"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Assigned Nurse</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a nurse" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableNurses.map(nurse => (
                                  <SelectItem key={nurse} value={nurse}>{nurse}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                </section>
                
                <Separator />

                <section>
                   <h3 className="text-lg font-medium mb-2">Admission Details</h3>
                   <FormField control={form.control} name="chiefComplaint" render={({ field }) => (
                     <FormItem>
                       <FormLabel>Chief Complaint</FormLabel>
                       <FormControl><Textarea placeholder="e.g., Chest pain, shortness of breath..." {...field} /></FormControl>
                       <FormMessage />
                     </FormItem>
                   )} />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <FormField control={form.control} name="admitDate" render={({ field }) => (
                       <FormItem className="flex flex-col">
                         <FormLabel>Admit Date</FormLabel>
                         <Popover>
                           <PopoverTrigger asChild>
                             <FormControl>
                               <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                 {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                               </Button>
                             </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                             <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                           </PopoverContent>
                         </Popover>
                         <FormMessage />
                       </FormItem>
                     )} />
                      <FormField control={form.control} name="dischargeDate" render={({ field }) => (
                       <FormItem className="flex flex-col">
                         <FormLabel>Expected Discharge Date</FormLabel>
                         <Popover>
                           <PopoverTrigger asChild>
                             <FormControl>
                               <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                 {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                               </Button>
                             </FormControl>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                             <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                           </PopoverContent>
                         </Popover>
                         <FormMessage />
                       </FormItem>
                     )} />
                   </div>
                </section>

                <Separator />
                
                <section>
                    <h3 className="text-lg font-medium mb-2">Clinical Status & Notes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField control={form.control} name="diet" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diet</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select diet"/></SelectTrigger></FormControl>
                              <SelectContent>
                                {DIETS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage/>
                          </FormItem>
                       )}/>
                        <FormField control={form.control} name="mobility" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobility</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select mobility"/></SelectTrigger></FormControl>
                              <SelectContent>
                                {MOBILITY_STATUSES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage/>
                          </FormItem>
                       )}/>
                       <FormField control={form.control} name="codeStatus" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select code status"/></SelectTrigger></FormControl>
                              <SelectContent>
                                {CODE_STATUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage/>
                          </FormItem>
                       )}/>
                        <FormField control={form.control} name="orientationStatus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alert & Oriented</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select status"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {ORIENTATION_STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                       <FormField control={form.control} name="ldas" render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>LDAs</FormLabel>
                            <FormControl><Input placeholder="PICC, Foley..." {...field} /></FormControl>
                            <FormDescription>Lines, Drains, Airways (comma-separated).</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem className="mt-4">
                            <FormLabel>Pending Procedures/Treatments</FormLabel>
                            <FormControl><Textarea placeholder="e.g., MRI of brain, consult with Cardiology..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </section>

                <Separator />
                
                <section>
                  <h3 className="text-lg font-medium mb-2">Alerts, Risks & Status</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          { name: "isFallRisk", label: "Fall Risk" },
                          { name: "isSeizureRisk", label: "Seizure Risk" },
                          { name: "isAspirationRisk", label: "Aspiration Risk" },
                          { name: "isIsolation", label: "Isolation" },
                          { name: "isInRestraints", label: "Restraints" },
                          { name: "isComfortCareDNR", label: "Comfort Care / DNR" },
                        ].map(item => (
                          <FormField
                            key={item.name}
                            control={form.control}
                            name={item.name as keyof AdmitPatientFormValues}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value as boolean}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>{item.label}</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">
                {isUpdateMode ? <Edit className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {isUpdateMode ? 'Update Patient' : 'Admit Patient'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
