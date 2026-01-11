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
      <div className="relative w-30 h-30 mb-12 flex items-center justify-center">
        {/* Soft Background Plate */}
        <div className="absolute inset-0 bg-base-200/40 rounded-[2.5rem] rotate-6 border border-base-300/50" />
        
        {/* Main Glass Plate */}
        <div className="absolute inset-0 bg-base-100 border border-base-300 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center transition-transform hover:rotate-3 duration-500">
          <div className="relative">
            <Search size={48} strokeWidth={1} className="text-base-content/20" />
            {/* Animated Dot */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full animate-ping opacity-75" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--p),0.5)]" />
          </div>
        </div>

        {/* Decorative Floating Elements */}
        <div className="absolute -bottom-2 -left-4 w-12 h-12 bg-base-100 border border-base-300 rounded-2xl shadow-sm flex items-center justify-center rotate-[-12deg] animate-bounce [animation-duration:4s]">
           <div className="w-6 h-1 bg-base-300 rounded-full" />
        </div>
      </div>

      {/* 2. LUXURY TYPOGRAPHY */}
      <div className="max-w-[420px] text-center space-y-4">
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