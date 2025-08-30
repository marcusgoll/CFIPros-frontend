"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { featuresMenu, instructorsMenu } from '@/lib/config/navigation';

interface MobileNavigationProps {
  isSignedIn: boolean;
  isLoaded: boolean;
  SignInButton: React.ComponentType<Record<string, unknown>>;
  SignUpButton: React.ComponentType<Record<string, unknown>>;
  UserButton: React.ComponentType<Record<string, unknown>>;
}

export function MobileNavigation({ isSignedIn, isLoaded, SignInButton, SignUpButton, UserButton }: MobileNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleMobileMenuItemClick = useCallback(() => {
    setMobileMenuOpen(false);
    setMobileAccordion(null);
  }, []);

  const toggleMobileAccordion = useCallback((menu: string) => {
    setMobileAccordion(current => current === menu ? null : menu);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setMobileAccordion(null);
  }, []);

  // Focus management and close mobile menu when clicking outside
  useEffect(() => {
    // Lock/unlock body scroll
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';

    // Focus management - trap focus within mobile menu
    const menuElement = mobileMenuRef.current;
    let handleTabKey: ((e: KeyboardEvent) => void) | null = null;
    let handleClickOutside: ((event: MouseEvent) => void) | null = null;

    if (mobileMenuOpen && menuElement) {
      const focusableElements = menuElement.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Focus first element when menu opens
      firstFocusable?.focus();

      // Trap focus
      handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
        // Close on Escape
        if (e.key === 'Escape') {
          closeMobileMenu();
          const menuButton = document.querySelector('[aria-controls="mobile-menu"]') as HTMLElement;
          menuButton?.focus();
        }
      };
      document.addEventListener('keydown', handleTabKey);

      // Handle clicks outside
      handleClickOutside = (event: MouseEvent) => {
        if (menuElement && !menuElement.contains(event.target as Node)) {
          closeMobileMenu();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      if (handleTabKey) {
        document.removeEventListener('keydown', handleTabKey);
      }
      if (handleClickOutside) {
        document.removeEventListener('mousedown', handleClickOutside);
      }
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMobileMenu]);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          type="button"
          className="text-foreground/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open main menu"}
        >
          {mobileMenuOpen ? (
            <X className="block h-6 w-6" />
          ) : (
            <Menu className="block h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          id="mobile-menu"
          className="lg:hidden border-t border-border bg-background animate-slide-down absolute top-full left-0 right-0 z-40"
          data-testid="mobile-menu"
        >
          <div className="space-y-1 pb-4 pt-2 px-4">
            {/* Features Accordion */}
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md"
                onClick={() => toggleMobileAccordion('features')}
                aria-expanded={mobileAccordion === 'features'}
              >
                Our Features
                <ChevronRight className={cn(
                  "h-5 w-5 transition-transform",
                  mobileAccordion === 'features' && "rotate-90"
                )} />
              </button>
              {mobileAccordion === 'features' && (
                <div className="pl-6 pr-3 py-2 space-y-2 animate-slide-down">
                  {featuresMenu.columns?.flatMap(column => column.items).map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md"
                      onClick={handleMobileMenuItemClick}
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Research Menu */}
            <Link
              href="/research"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md"
              onClick={handleMobileMenuItemClick}
            >
              Research
            </Link>

            {/* Instructors Accordion */}
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md"
                onClick={() => toggleMobileAccordion('instructors')}
                aria-expanded={mobileAccordion === 'instructors'}
              >
                For Instructors
                <ChevronRight className={cn(
                  "h-5 w-5 transition-transform",
                  mobileAccordion === 'instructors' && "rotate-90"
                )} />
              </button>
              {mobileAccordion === 'instructors' && (
                <div className="pl-6 pr-3 py-2 space-y-2 animate-slide-down">
                  {instructorsMenu.items?.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md"
                      onClick={handleMobileMenuItemClick}
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Flight Schools Menu */}
            <Link
              href="/schools"
              className="block px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md"
              onClick={handleMobileMenuItemClick}
            >
              For Flight Schools
            </Link>

            {/* Mobile Authentication */}
            <div className="border-t border-border pt-4 mt-4 space-y-2">
              {!isLoaded ? (
                <div className="px-3 py-2 space-y-2">
                  <div className="h-10 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-10 bg-muted animate-pulse rounded-md"></div>
                </div>
              ) : isSignedIn ? (
                <div className="px-3 py-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="block w-full text-left px-3 py-2 text-base font-medium text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-md">
                      Login
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="block w-full text-left px-3 py-2 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                      Sign Up
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
