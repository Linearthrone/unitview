
'use client';

import { useState, useEffect } from 'react';
import type { Patient } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import {
  AlertTriangle,
  BrainCircuit,
  Wind,
  ShieldAlert,
  Ban,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintableAssignmentsProps {
  unitName: string;
  chargeNurseName: string;
  nurses: Nurse[];
  techs: PatientCareTech[];
  patients: Patient[];
}

const alertIcons: { key: keyof Patient, Icon: LucideIcon, label: string }[] = [
    { key: 'isFallRisk', Icon: AlertTriangle, label: 'Fall Risk' },
    { key: 'isSeizureRisk', Icon: BrainCircuit, label: 'Seizure Risk' },
    { key: 'isAspirationRisk', Icon: Wind, label: 'Aspiration Risk' },
    { key: 'isIsolation', Icon: ShieldAlert, label: 'Isolation' },
    { key: 'isInRestraints', Icon: Ban, label: 'Restraints' },
    { key: 'isComfortCareDNR', Icon: HeartHandshake, label: 'Comfort/DNR' },
];

const PrintableAssignments: React.FC<PrintableAssignmentsProps> = ({
  unitName,
  chargeNurseName,
  nurses,
  techs,
  patients,
}) => {
  const [shift, setShift] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    // This logic is now in useEffect to ensure it only runs on the client,
    // preventing a hydration mismatch.
    const currentHour = new Date().getHours();
    // Day shift from 2 AM (2) to 1:59 PM (13)
    // Night shift from 2 PM (14) to 1:59 AM (1)
    if (currentHour >= 2 && currentHour < 14) {
      setShift('Day Shift');
    } else {
      setShift('Night Shift');
    }
    setDate(new Date().toLocaleDateString('en-US'));
  }, []);
  
  const patientMap = new Map(patients.map(p => [p.id, p]));

  return (
    <div id="printable-assignments-report" className="hidden print:block text-black font-sans p-4">
      <div className="report-header relative mb-4">
        <div className="unit-name">{unitName}</div>
        <div className="flex justify-between w-full">
            <div>
              <p>{date}</p>
              <p>{shift}</p>
            </div>
            <div>
              <p className="text-right"><strong>Charge Nurse:</strong> {chargeNurseName}</p>
              <p className="text-right"><strong>Spectra:</strong> x5501</p>
            </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        {/* Nurse Columns */}
        <div className="grid grid-cols-6 gap-2 flex-grow">
          {nurses.map(nurse => (
            <div key={nurse.id} className="border border-black p-2 flex flex-col">
              <h3 className="font-bold text-center border-b border-black pb-1 mb-1">{nurse.name}</h3>
              <p className="text-center text-xs mb-2">{nurse.spectra}</p>
              <div className="space-y-1">
                {nurse.assignedPatientIds.map(patientId => {
                  const patient = patientId ? patientMap.get(patientId) : null;
                  if (!patient) return <div key={`empty-${Math.random()}`} className="h-6" />;
                  
                  const activeAlerts = alertIcons.filter(alert => patient[alert.key]);
                  
                  return (
                    <div key={patient.id} className="flex justify-between items-center text-sm">
                      <span>{patient.roomDesignation}</span>
                      <div className="flex gap-1">
                        {activeAlerts.map(({ Icon, label }) => <Icon key={label} title={label} className="h-3 w-3" />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* PCT Column */}
        <div className="border border-black p-2 w-48 flex-shrink-0">
           <h3 className="font-bold text-center border-b border-black pb-1 mb-1">Patient Care Techs</h3>
           <div className="space-y-3 mt-2">
             {techs.map(tech => (
                <div key={tech.id} className="text-sm">
                    <p className="font-bold">{tech.name}</p>
                    <p className="text-xs">{tech.spectra}</p>
                    <p className="text-xs">{tech.assignmentGroup}</p>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableAssignments;
