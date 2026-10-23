'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../lib/theme';

interface ThemeToggleProps {
  className?: string;
  variant?: 'dropdown' | 'segmented';
  align?: 'left' | 'right';
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({
  className = '',
  variant = 'dropdown',
  align = 'right',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Segmented control variant
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme selection"
        className={`inline-flex items-center p-0.5 border border-stroke bg-surface ${className}`}
      >
        {THEME_OPTIONS.map(({ mode, label, icon: Icon }) => {
          const isSelected = theme === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(mode)}
              title={`${label} theme`}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-medium tracking-wider uppercase transition-all
                ${isSelected
                  ? 'bg-surface-raised text-ink border border-stroke-hover shadow-tactile font-semibold'
                  : 'text-ink-dim hover:text-ink hover:bg-surface-raised/40'
                }
              `}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant (compact & architectural)
  const CurrentIcon =
    theme === 'system'
      ? Monitor
      : resolvedTheme === 'dark'
      ? Moon
      : Sun;

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Current theme: ${theme}. Click to change theme.`}
        title={`Theme: ${theme.toUpperCase()}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-stroke hover:border-stroke-hover bg-surface hover:bg-surface-raised text-ink transition-colors tactile-btn"
      >
        <CurrentIcon className="h-3.5 w-3.5 text-accent-warm transition-transform duration-200" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted hidden sm:inline">
          {theme}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Theme options"
          className={`
            absolute top-full mt-1.5 z-50 min-w-[140px] p-1 border border-stroke bg-surface-overlay backdrop-blur-md shadow-tactile-lg animate-fade-in
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-[0.2em] text-ink-dim border-b border-stroke/50 mb-1">
            Theme Mode
          </div>
          {THEME_OPTIONS.map(({ mode, label, icon: Icon }) => {
            const isSelected = theme === mode;
            return (
              <button
                key={mode}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setTheme(mode);
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }}
                className={`
                  w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-mono tracking-wider transition-colors text-left
                  ${isSelected
                    ? 'text-ink bg-surface-raised font-semibold border-l-2 border-accent-warm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-raised/60'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-accent-warm' : 'text-ink-dim'}`} />
                  <span>{label}</span>
                </div>
                {isSelected && (
                  <Check className="h-3 w-3 text-accent-warm ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

