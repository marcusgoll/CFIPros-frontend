"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { instructorsMenu } from '@/lib/config/navigation';

export function InstructorDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      global.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimeout();
    setIsOpen(true);
  }, [clearTimeout]);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  const handleClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [isOpen]);

  // Close dropdown on outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        global.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={dropdownRef} 
      className="relative ml-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors group"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="For Instructors menu"
      >
        For Instructors
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "relative top-[1px] ml-1 h-3 w-3 transition duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        >
          <path
            d="m4.93896 2.05005 6.11208 6.11208-6.11208 6.11208"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="rotate(90 7.5 7.5)"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-popover rounded-md shadow-lg border border-border z-50">
          <div className="p-4">
            <div className="space-y-2">
              {instructorsMenu.items?.map((item, itemIndex) => {
                const IconComponent = item.icon ? Icons[item.icon] as React.ComponentType<{ className: string }> : null;
                return (
                  <Link 
                    key={itemIndex} 
                    href={item.href} 
                    className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent/50 transition-colors group block"
                    onClick={() => setIsOpen(false)}
                  >
                    {IconComponent && (
                      <div className="flex-shrink-0 mt-1 text-primary-600">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-popover-foreground group-hover:text-primary">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
