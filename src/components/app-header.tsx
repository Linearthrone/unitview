import React from 'react';
import { Stethoscope } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3">
        <Stethoscope className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
