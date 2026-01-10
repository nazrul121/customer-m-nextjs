'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce'; // Your existing hook

interface DataTableToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isFetching: boolean;
  actionSlot?: React.ReactNode; // For "Add User" buttons, etc.
}

export function DataTableToolbar({
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  isFetching,
  actionSlot
}: DataTableToolbarProps) {
  // Local state for immediate typing feedback
  const [value, setValue] = useState(searchTerm);
  const debouncedValue = useDebounce(value, 500);

  // Sync debounced value to parent
  useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
      <div className="flex items-center justify-between w-full gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input input-bordered w-full max-w-xs"
        />

        <select className="select select-bordered md:w-auto" value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={isFetching}>
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>

      {actionSlot && <div>{actionSlot}</div>}
    </div>

  );
}