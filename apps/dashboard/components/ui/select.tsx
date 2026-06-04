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
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            value, onValueChange, isOpen, setIsOpen, placeholder,
          } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
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

export function SelectTrigger({ className = '', isOpen, setIsOpen, placeholder, children }: SelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={() => setIsOpen?.(!isOpen)}
      className={`form-input ${className}`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', textAlign: 'left',
        borderColor: isOpen ? 'var(--accent)' : undefined,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children || placeholder || 'Select…'}
      </span>
      <svg
        width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        style={{
          color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
        }}
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
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
      background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)',
      borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      zIndex: 50, maxHeight: 240, overflowY: 'auto', padding: 4,
    }}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            currentValue: value, onValueChange, setIsOpen,
          } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return child;
      })}
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
      onClick={() => { onValueChange?.(value); setIsOpen?.(false); }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
        fontSize: 13, textAlign: 'left', fontFamily: 'inherit',
        background: isSelected ? 'var(--accent-dim)' : 'transparent',
        color: isSelected ? '#818cf8' : 'var(--text-primary)',
        fontWeight: isSelected ? 600 : 400,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-base)'; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      {isSelected && (
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ flexShrink: 0, marginLeft: 8, color: '#818cf8' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
