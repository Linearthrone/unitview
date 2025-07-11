
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Smartphone } from 'lucide-react';

const ChargeNurseCard: React.FC = () => {
  return (
    <Card className="flex flex-col h-full shadow-lg bg-secondary/50 border-primary/50">
      <CardHeader className="p-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          <span>Charge Nurse</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col justify-center items-center text-center">
        <div className="space-y-4">
            <div>
                <p className="text-4xl font-bold">RN Sarah Jones</p>
            </div>
             <div>
                 <p className="font-bold text-3xl flex items-center gap-2">
                    <Smartphone className="h-7 w-7"/>
                    <span>x5501</span>
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChargeNurseCard;
