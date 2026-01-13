import React from 'react';
import { Search, RotateCcw, Database, LayoutGrid } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'search' | 'initial';
  title?: string;
  message?: string;
  onReset?: () => void;
  action?: React.ReactNode;
}

export function EmptyState({ 
  variant = 'search', 
  title, 
  message, 
  onReset,
  action 
}: EmptyStateProps) {
  
  // Adaptive configuration based on variant
  const config = {
    search: {
      icon: <Search size={44} strokeWidth={1} />,
      defaultTitle: <>No <span className="font-serif italic text-primary/80">matches...</span></>,
      defaultMessage: "We couldn't find what you're looking for. Try adjusting your filters.",
      showReset: true,
    },
    initial: {
      icon: <LayoutGrid size={44} strokeWidth={1} />,
      defaultTitle: <>Collection <span className="font-serif italic text-primary/80">empty</span></>,
      defaultMessage: "There are no records in this view yet. Start by adding a new entry.",
      showReset: false,
    }
  }[variant];

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 animate-in fade-in zoom-in-95 duration-700">
      
      {/* 1. VISUAL COMPOSITION */}
      <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
        {/* Ambient Aura */}
        <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-2xl scale-150" />

        {/* Floating Decorative Plates */}
        <div className="absolute inset-0 bg-base-200/40 rounded-[2.5rem] rotate-12 border border-base-content/5" />
        
        {/* Main Glass Vessel */}
        <div className="absolute inset-0 bg-base-100 border border-base-content/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex items-center justify-center transition-transform hover:scale-105 duration-500 group">
          <div className="text-base-content/20 group-hover:text-primary/40 transition-colors duration-500">
            {config.icon}
          </div>

          {/* Status Indicator Dot */}
          <div className="absolute -top-1 -right-1">
            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${variant === 'search' ? 'bg-primary' : 'bg-base-content'}`} />
            <div className={`relative w-3 h-3 rounded-full border-2 border-base-100 ${variant === 'search' ? 'bg-primary shadow-[0_0_10px_rgba(var(--p),0.5)]' : 'bg-base-content/20'}`} />
          </div>
        </div>
      </div>
      
      {/* 2. TYPOGRAPHY */}
      <div className="max-w-md text-center space-y-3">
        <h3 className="text-4xl font-light text-base-content tracking-tight">
          {title || config.defaultTitle}
        </h3>
        <p className="text-base-content/40 text-lg font-light leading-relaxed px-8">
          {message || config.defaultMessage}
        </p>
      </div>

      {/* 3. ACTIONS */}
      <div className="mt-10 flex flex-col items-center gap-4">
        {config.showReset && onReset && (
          <button 
            onClick={onReset}
            className="group btn btn-ghost h-12 px-8 rounded-xl border border-base-300 hover:border-primary hover:bg-transparent transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <RotateCcw size={16} className="text-base-content/40 group-hover:text-primary transition-colors group-hover:-rotate-180 duration-500" />
              <span className="text-xs font-bold tracking-widest uppercase text-base-content/60 group-hover:text-base-content">
                Reset Filters
              </span>
            </div>
          </button>
        )}
        
        {/* Custom action slot (e.g. "Add New Record" button) */}
        {action && <div className="animate-in slide-in-from-bottom-2 duration-1000 delay-300">{action}</div>}
      </div>
    </div>
  );
}