
import React from 'react';
import { Stethoscope, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  isLayoutLocked: boolean;
  onToggleLayoutLock: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, isLayoutLocked, onToggleLayoutLock }) => {
  return (
    <header className="bg-card text-card-foreground shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-headline font-bold text-primary">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onToggleLayoutLock}>
          {isLayoutLocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
          {isLayoutLocked ? 'Layout Locked' : 'Lock Layout'}
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
