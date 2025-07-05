
'use client';

import type { Patient, MobilityStatus } from '@/types/patient';
import {
  BedDouble,
  Accessibility,
  Footprints,
  AlertTriangle,
  ShieldAlert,
  Ban,
  BrainCircuit,
  Wind,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintableReportProps {
  patients: Patient[];
}

const mobilityIcons: Record<MobilityStatus, LucideIcon> = {
  'Bed Rest': BedDouble,
  'Assisted': Accessibility,
  'Independent': Footprints,
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
};

const PrintableReport: React.FC<PrintableReportProps> = ({ patients }) => {
  const activePatients = patients.filter(p => p.gridRow > 0 && p.gridColumn > 0 && p.name !== 'Vacant');
  const sortedPatients = [...activePatients].sort((a, b) => a.bedNumber - b.bedNumber);

  return (
    <div className="hidden print:block text-black font-sans">
      <h1 className="text-xl font-bold text-center mb-2">Unit Charge Report</h1>
      <p className="text-center text-sm mb-4">Generated on: {new Date().toLocaleString()}</p>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {sortedPatients.map((patient) => {
          const MobilityIcon = mobilityIcons[patient.mobility];
          const alerts: { Icon: LucideIcon; label: string; colorClass: string; }[] = [];
          if (patient.isFallRisk) alerts.push({ Icon: AlertTriangle, label: 'Fall Risk', colorClass: 'text-yellow-600' });
          if (patient.isSeizureRisk) alerts.push({ Icon: BrainCircuit, label: 'Seizure Risk', colorClass: 'text-orange-600' });
          if (patient.isAspirationRisk) alerts.push({ Icon: Wind, label: 'Aspiration Risk', colorClass: 'text-blue-600' });
          if (patient.isIsolation) alerts.push({ Icon: ShieldAlert, label: 'Isolation', colorClass: 'text-green-600' });
          if (patient.isInRestraints) alerts.push({ Icon: Ban, label: 'Restraints', colorClass: 'text-red-600' });
          if (patient.isComfortCareDNR) alerts.push({ Icon: HeartHandshake, label: 'Comfort/DNR', colorClass: 'text-purple-600' });

          const genderColor = patient.gender === 'Male' ? 'bg-sky-100' : patient.gender === 'Female' ? 'bg-pink-100' : 'bg-gray-100';
          const dnrColor = patient.isComfortCareDNR ? 'bg-purple-200' : '';

          return (
            <div key={patient.id} className={cn("border border-black rounded-md p-2 text-xs page-break-inside-avoid flex flex-col", dnrColor || genderColor)}>
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-sm">Bed {patient.bedNumber} - {patient.name}</div>
                <div className="font-bold text-sm">{patient.age} {patient.gender?.[0]}</div>
              </div>

              <div className="mb-1">
                <span className="font-semibold">Admit:</span> {formatDate(patient.admitDate)} / <span className="font-semibold">EDD:</span> {formatDate(patient.dischargeDate)}
              </div>
              <div className="italic mb-1 truncate">
                 <span className="font-semibold not-italic">Complaint:</span> {patient.chiefComplaint}
              </div>

              <div className="grid grid-cols-2 gap-x-2 text-[11px] flex-grow">
                <div><span className="font-semibold">Diet:</span> {patient.diet}</div>
                <div className="flex items-center gap-1"><span className="font-semibold">Mobility:</span> <MobilityIcon className="h-3 w-3"/> {patient.mobility}</div>
                <div><span className="font-semibold">Code:</span> {patient.codeStatus}</div>
                <div><span className="font-semibold">Nurse:</span> {patient.assignedNurse || 'N/A'}</div>
                <div className="col-span-2"><span className="font-semibold">LDAs:</span> {patient.ldas.join(', ') || 'None'}</div>
              </div>
              
              {alerts.length > 0 && <div className="border-t border-black/50 mt-1 pt-1 flex items-center gap-2">
                 <span className="font-semibold">Alerts:</span>
                 <div className="flex flex-wrap gap-1.5">
                    {alerts.map(a => <a.Icon key={a.label} title={a.label} className={cn("h-4 w-4", a.colorClass)} />)}
                 </div>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintableReport;
