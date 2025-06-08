
"use client";

import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';

export default function Home() {
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const toggleLayoutLock = () => {
    setIsLayoutLocked(prev => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        subtitle="48 Bed Unit Patient Dashboard"
        isLayoutLocked={isLayoutLocked}
        onToggleLayoutLock={toggleLayoutLock}
      />
      <main className="flex-grow flex flex-col overflow-hidden">
        <PatientGrid isLayoutLocked={isLayoutLocked} />
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        UnitView &copy; {currentYear !== null ? currentYear : 'Loading...'}
      </footer>
    </div>
  );
}
