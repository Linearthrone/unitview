
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Smartphone } from 'lucide-react';

interface ChargeNurseCardProps {
  name: string;
}

const ChargeNurseCard: React.FC<ChargeNurseCardProps> = ({ name }) => {
  return (
    <Card className="flex flex-col h-full shadow-lg bg-secondary/50 border-primary/50">
      <CardHeader className="p-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <span>Charge Nurse</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col justify-center items-center text-center">
        <div className="space-y-2">
            <div>
                <p className="text-xl font-bold">{name}</p>
            </div>
             <div>
                 <p className="font-bold text-lg flex items-center gap-2">
                    <Smartphone className="h-4 w-4"/>
                    <span>x5501</span>
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChargeNurseCard;
