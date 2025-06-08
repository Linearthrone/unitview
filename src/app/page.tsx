import AppHeader from '@/components/app-header';
import PatientGrid from '@/components/patient-grid';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader title="UnitView" subtitle="48 Bed Unit Patient Dashboard" />
      <main className="flex-grow flex flex-col py-4 px-4">
        <PatientGrid />
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        UnitView &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
