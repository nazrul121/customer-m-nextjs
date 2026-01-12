import React from 'react';
import { Search, RotateCcw, Command } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export function EmptyState({ 
  title = "No Matches Found", 
  message = "We couldn't find what you're looking for. Try adjusting your search or filters to broaden your results.",
  onReset 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center  px-4 transition-all duration-700 ease-in-out animate-in fade-in zoom-in-95">
      
      {/* 1. SURREALIST ICON COMPOSITION */}
      <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
        {/* 1. The Background "Aura" - Adapts to primary color */}
        <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-2xl scale-125" />

        {/* 2. Soft Background Plate (The offset one) */}
        <div className="absolute inset-0 bg-base-200/50 rounded-[2.5rem] rotate-6 border border-base-content/5" />
        
        {/* 3. Main Glass Plate */}
        <div className="absolute inset-0 bg-base-100 border border-base-content/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all hover:scale-105 hover:rotate-0 duration-500 group">
          
          <div className="relative">
            {/* Thinner icon for a more "lux" feel */}
            <Search 
              size={44} 
              strokeWidth={1} 
              className="text-base-content/20 group-hover:text-primary/40 transition-colors duration-500" 
            />
            
            {/* 4. The "Ping" - Using semantic primary color */}
            <div className="absolute -top-1 -right-1">
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-40" />
              <div className="relative w-3.5 h-3.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--p),0.5)] border-2 border-base-100" />
            </div>
          </div>
        </div>

        {/* 5. Decorative Floating Element (The mini-card) */}
        <div className="absolute -bottom-4 -left-6 w-14 h-14 bg-base-100/80 backdrop-blur-md border border-base-content/10 rounded-2xl shadow-xl flex items-center justify-center rotate-[-12deg] animate-bounce [animation-duration:5s]">
          {/* Mimic a small bar chart or lines */}
          <div className="flex flex-col gap-1 w-full px-3">
              <div className="w-full h-1 bg-base-content/10 rounded-full" />
              <div className="w-2/3 h-1 bg-base-content/10 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* 2. LUXURY TYPOGRAPHY */}
      <div className="max-w-105 text-center space-y-4">
        <h3 className="text-4xl font-light text-base-content tracking-tight">
          Keep <span className="font-serif italic text-primary/80">searching...</span>
        </h3>
        <p className="text-base-content/40 text-lg font-light leading-relaxed">
          {message}
        </p>
      </div>

      {/* 3. THE "GHOST" ACTION BUTTON */}
      {onReset && (
        <div className="mt-12 flex flex-col items-center gap-6">
          <button 
            onClick={onReset}
            className="group btn btn-ghost h-14 px-12 rounded-2xl border border-base-300 hover:border-primary hover:bg-transparent transition-all duration-500 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-base-200 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-700" />
              </div>
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-base-content/60 group-hover:text-base-content">
                Clear Filters
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}