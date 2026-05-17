'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, placeholder, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            value,
            onValueChange,
            isOpen,
            setIsOpen,
            placeholder,
          } as any);
        }
        return child;
      })}
    </div>
  );
}

interface SelectTriggerProps {
  className?: string;
  value?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  placeholder?: string;
  children?: React.ReactNode;
}

export function SelectTrigger({ className, value, isOpen, setIsOpen, placeholder, children }: SelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={() => setIsOpen?.(!isOpen)}
      className={`w-full flex items-center justify-between px-3.5 py-2 bg-[#090b14]/90 border border-slate-800/80 hover:border-slate-700/60 rounded-lg text-xs text-slate-200 transition-all duration-300 font-medium select-none text-left focus:outline-none focus:ring-1 focus:ring-violet-500/50 backdrop-blur-md ${className || ''}`}
    >
      <span className="truncate">{children || placeholder || 'Select option...'}</span>
      <svg
        className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-violet-400' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

interface SelectContentProps {
  isOpen?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  setIsOpen?: (open: boolean) => void;
  children: React.ReactNode;
}

export function SelectContent({ isOpen, value, onValueChange, setIsOpen, children }: SelectContentProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 mt-1.5 min-w-[8rem] overflow-hidden rounded-lg border border-slate-800/80 bg-[#090b14] shadow-[0_4px_20px_rgba(0,0,0,0.6)] z-50 backdrop-blur-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="p-1 flex flex-col gap-0.5">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              currentValue: value,
              onValueChange,
              setIsOpen,
            } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
}

interface SelectItemProps {
  value: string;
  currentValue?: string;
  onValueChange?: (value: string) => void;
  setIsOpen?: (open: boolean) => void;
  children: React.ReactNode;
}

export function SelectItem({ value, currentValue, onValueChange, setIsOpen, children }: SelectItemProps) {
  const isSelected = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => {
        onValueChange?.(value);
        setIsOpen?.(false);
      }}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs rounded-md transition-all duration-150 select-none font-medium ${
        isSelected
          ? 'bg-violet-600/90 text-white font-bold'
          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <svg className="w-3.5 h-3.5 text-white shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
