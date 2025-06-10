
"use client";

import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';
import { layouts as appLayouts, type LayoutName } from '@/lib/layouts';

export default function Home() {
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<LayoutName>('default');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    const savedLayout = localStorage.getItem('lastSelectedLayoutName') as LayoutName | null;
    if (savedLayout && appLayouts[savedLayout]) {
      setCurrentLayoutName(savedLayout);
      if (savedLayout === 'eighthFloor') {
        setIsLayoutLocked(true);
      }
    } else if (savedLayout && !appLayouts[savedLayout]) {
      // If a saved layout name exists but is no longer valid (e.g. removed from code)
      // fall back to default and clear the invalid localStorage item.
      console.warn(`Saved layout "${savedLayout}" not found. Falling back to default.`);
      setCurrentLayoutName('default');
      localStorage.removeItem('lastSelectedLayoutName');
    }
    // If no saved layout or invalid, it defaults to 'default' from useState and eighthFloor lock remains false.

  }, []);

  const handleSelectLayout = (newLayoutName: LayoutName) => {
    setCurrentLayoutName(newLayoutName);
    localStorage.setItem('lastSelectedLayoutName', newLayoutName);
    if (newLayoutName === 'eighthFloor') {
      setIsLayoutLocked(true);
    } else {
      // For other layouts, retain the user's explicit lock choice,
      // or unlock if it was previously locked due to 'eighthFloor'.
      const userExplicitlyLocked = localStorage.getItem('userLayoutLockState') === 'true';
      setIsLayoutLocked(userExplicitlyLocked);
    }
  };

  const toggleLayoutLock = () => {
    if (currentLayoutName === 'eighthFloor') return;

    setIsLayoutLocked(prev => {
      const newLockState = !prev;
      localStorage.setItem('userLayoutLockState', String(newLockState));
      return newLockState;
    });
  };

  const isEffectivelyLocked = currentLayoutName === 'eighthFloor' || isLayoutLocked;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        subtitle="48 Bed Unit Patient Dashboard"
        isLayoutLocked={isEffectivelyLocked}
        onToggleLayoutLock={toggleLayoutLock}
        currentLayoutName={currentLayoutName}
        onSelectLayout={handleSelectLayout}
        availableLayouts={Object.keys(appLayouts) as LayoutName[]}
      />
      <main className="flex-grow flex flex-col overflow-auto"> {/* Changed overflow-hidden to overflow-auto */}
        <PatientGrid
          currentLayoutName={currentLayoutName}
          isEffectivelyLocked={isEffectivelyLocked}
        />
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        UnitView &copy; {currentYear !== null ? currentYear : 'Loading...'}
      </footer>
    </div>
  );
}
