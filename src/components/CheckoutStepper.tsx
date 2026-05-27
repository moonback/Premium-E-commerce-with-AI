// src/components/CheckoutStepper.tsx
import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  activeStep: number; // 0,1,2
}

const steps = ['Panier', 'Infos & Livraison', 'Paiement'];

export default function CheckoutStepper({ activeStep }: StepperProps) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((label, idx) => {
        const isActive = idx === activeStep;
        const isCompleted = idx < activeStep;
        return (
          <div key={idx} className="flex-1 flex items-center last:flex-initial">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent text-white'
                    : isActive
                    ? 'bg-ink text-bg font-bold'
                    : 'bg-ink/10 text-ink/30'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold font-sans">{idx + 1}</span>
                )}
              </div>
            </div>
            
            <span 
              className={`ml-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${
                isActive ? 'text-ink' : 'text-ink/40'
              }`}
            >
              {label}
            </span>

            {idx < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                  isCompleted ? 'bg-accent' : 'bg-ink/10'
                }`} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
