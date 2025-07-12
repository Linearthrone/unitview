
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Phone, User } from 'lucide-react';

interface UnitClerkCardProps {
  name: string;
}

const UnitClerkCard: React.FC<UnitClerkCardProps> = ({ name }) => {
  return (
    <Card className="flex flex-col h-full shadow-md bg-secondary/50 border-accent/50">
      <CardHeader className="p-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-accent" />
          <span>Unit Clerk</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col justify-center items-center text-center">
        <div className="space-y-2">
            <div>
                <p className="font-bold text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{name}</span>
                </p>
            </div>
             <div>
                <p className="font-bold text-lg flex items-center gap-2">
                    <Phone className="h-4 w-4"/>
                    <span>(555) 123-4567</span>
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitClerkCard;
