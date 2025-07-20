
import React from 'react';
import UnitViewClient from '@/components/unit-view-client';
import type { LayoutName } from '@/types/patient';
import * as layoutService from '@/services/layoutService';
import * as patientService from '@/services/patientService';
import * as nurseService from '@/services/nurseService';
import * as spectraService from '@/services/spectraService';

export const dynamic = 'force-dynamic';

// This is now a Server Component
export default async function Home() {
  
  // Fetch all initial data on the server
  const [userPrefs, initialSpectra, allLayouts] = await Promise.all([
    layoutService.getUserPreferences(),
    spectraService.getSpectraPool(),
    layoutService.getAvailableLayouts(),
  ]);

  const layoutToLoad: LayoutName = (userPrefs.lastSelectedLayout && allLayouts.includes(userPrefs.lastSelectedLayout)) 
      ? userPrefs.lastSelectedLayout 
      : 'North-South View';
      
  const [initialPatients, initialNurses, initialTechs] = await Promise.all([
    patientService.getPatients(layoutToLoad),
    nurseService.getNurses(layoutToLoad),
    nurseService.getTechs(layoutToLoad),
  ]);

  const initialProps = {
    initialLayoutName: layoutToLoad,
    initialAvailableLayouts: allLayouts,
    initialIsLayoutLocked: userPrefs.isLayoutLocked,
    initialPatients,
    initialNurses,
    initialTechs,
    initialSpectraPool: initialSpectra,
  };

  // Render the client component with the fetched data
  return <UnitViewClient {...initialProps} />;
}
