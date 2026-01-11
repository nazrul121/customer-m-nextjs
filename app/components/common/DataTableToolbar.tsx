'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Loader2, ChevronDown, X } from 'lucide-react';

export function DataTableToolbar({
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  isFetching,
  actionSlot
}: DataTableToolbarProps) {
  const [value, setValue] = useState(searchTerm);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  const handleClear = () => {
    setValue('');
    onSearchChange('');
  };

  return (
    <div className="w-full mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* LEFT: MINIMALIST SEARCH BAR */}
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-base-content/30 group-focus-within:text-primary transition-colors">
            {isFetching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </div>
          
          <input type="text" placeholder="Quick search..." value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input w-full h-10 pl-10 pr-10 bg-base-100 border border-base-800 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all rounded-lg text-sm"
          />

          {value && !isFetching && (
            <button 
              onClick={handleClear}
              className="absolute inset-y-0 right-3 flex items-center text-base-content/30 hover:text-error transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* RIGHT: COMPACT SELECT & ACTIONS */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          
          <div className="flex items-center gap-3">
            <label className="text-[10px] border-base-800 font-bold uppercase tracking-widest opacity-40">Rows</label>
            <div className="relative">
              <select className="select select-bordered select-sm h-10 pl-3 pr-8 bg-base-100 border border-base-300 font-semibold focus:outline-none focus:border-primary rounded-lg appearance-none text-xs"
                value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}
                disabled={isFetching}
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none opacity-40">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {actionSlot && (
            <>
              <div className="h-6 w-px bg-base-300 hidden md:block"></div>
              <div className="shrink-0">
                {actionSlot}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}