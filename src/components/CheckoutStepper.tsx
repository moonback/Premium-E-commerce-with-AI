// src/components/CheckoutStepper.tsx
import React from 'react';
import { Check, Circle } from 'lucide-react';

interface StepperProps {
  activeStep: number; // 0,1,2
}

const steps = ['Panier', 'Infos & Livraison', 'Paiement'];

export default function CheckoutStepper({ activeStep }: StepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, idx) => {
        const isActive = idx === activeStep;
        const isCompleted = idx < activeStep;
        return (
          <div key={idx} className="flex-1 flex items-center">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isCompleted
                    ? 'bg-ink text-bg'
                    : isActive
                    ? 'bg-soft-green text-ink'
                    : 'bg-ink/10 text-ink/30'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
            </div>
            <span className={`ml-2 text-sm font-medium ${isActive ? 'text-ink' : 'text-ink/60'}`}> {label} </span>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-ink' : 'bg-ink/20'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
