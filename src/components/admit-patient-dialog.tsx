
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { CalendarIcon, UserPlus } from 'lucide-react';
import type { Patient, MobilityStatus, PatientGender, CodeStatus, OrientationStatus } from '@/types/patient';
import type { Nurse } from '@/types/nurse';

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

const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];
const GENDERS: PatientGender[] = ['Male', 'Female'];
const CODE_STATUSES: CodeStatus[] = ['Full Code', 'DNR', 'DNI', 'DNR/DNI'];
const DIETS = [
    "Regular", "NPO (Nothing by mouth)", "Cardiac Diet", "Diabetic Diet (ADA)", "Renal Diet", "Clear Liquids",
    "Full Liquids", "Mechanical Soft", "Pureed"
];
const ORIENTATION_STATUSES: OrientationStatus[] = ['x1', 'x2', 'x3', 'x4'];

const formSchema = z.object({
  bedNumber: z.coerce.number().min(1, "Bed number is required."),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(0, "Age must be a positive number.").max(130),
  gender: z.enum(GENDERS),
  chiefComplaint: z.string().min(1, "Chief complaint is required."),
  admitDate: z.date(),
  dischargeDate: z.date(),
  ldas: z.string().optional(),
  diet: z.string().min(1, "Diet is required."),
  mobility: z.enum(MOBILITY_STATUSES),
  codeStatus: z.enum(CODE_STATUSES),
  orientationStatus: z.enum(ORIENTATION_STATUSES),
  assignedNurse: z.string().min(1, "Nurse assignment is required."),
  isFallRisk: z.boolean().default(false),
  isSeizureRisk: z.boolean().default(false),
  isAspirationRisk: z.boolean().default(false),
  isIsolation: z.boolean().default(false),
  isInRestraints: z.boolean().default(false),
  isComfortCareDNR: z.boolean().default(false),
});

export type AdmitPatientFormValues = z.infer<typeof formSchema>;

interface AdmitPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AdmitPatientFormValues) => void;
  patients: Patient[];
  nurses: Nurse[];
}

export default function AdmitPatientDialog({ open, onOpenChange, onSave, patients, nurses }: AdmitPatientDialogProps) {
  const form = useForm<AdmitPatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      admitDate: new Date(),
      dischargeDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      assignedNurse: 'To Be Assigned',
      orientationStatus: 'x4',
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
    if (open) {
      form.reset({
        admitDate: new Date(),
        dischargeDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        name: '',
        age: undefined,
        bedNumber: undefined,
        chiefComplaint: '',
        ldas: '',
        assignedNurse: 'To Be Assigned',
        orientationStatus: 'x4',
        isFallRisk: false,
        isSeizureRisk: false,
        isAspirationRisk: false,
        isIsolation: false,
        isInRestraints: false,
        isComfortCareDNR: false,
      });
    }
  }, [open, form]);

  const onSubmit = (values: AdmitPatientFormValues) => {
    onSave(values);
  };
  
  const allBedNumbers = Array.from({ length: 48 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Admit / Transfer-In Patient</DialogTitle>
          <DialogDescription>
            Fill out the form to admit a new patient to an assigned bed. This will overwrite any existing patient data in that bed.
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
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a bed" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allBedNumbers.map(bed => {
                              const patientInBed = patients.find(p => p.bedNumber === bed);
                              const isVacant = !patientInBed || patientInBed.name === 'Vacant';
                              return (
                                <SelectItem key={bed} value={bed.toString()}>
                                  Bed {bed} {isVacant ? '(Empty)' : `(Occupied: ${patientInBed.name})`}
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <h3 className="text-lg font-medium mb-2">Clinical Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField control={form.control} name="diet" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diet</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select status"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {ORIENTATION_STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                       <FormField control={form.control} name="ldas" render={({ field }) => (
                          <FormItem>
                            <FormLabel>LDAs</FormLabel>
                            <FormControl><Input placeholder="PICC, Foley..." {...field} /></FormControl>
                            <FormDescription>Lines, Drains, Airways (comma-separated).</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </div>
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
                <UserPlus className="mr-2 h-4 w-4" />
                Admit Patient
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
