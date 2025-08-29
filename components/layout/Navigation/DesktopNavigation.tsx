"use client";

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui';
import { featuresMenu } from '@/lib/config/navigation';

export function DesktopNavigation() {
  return (
    <div className="hidden lg:flex items-center">
      <NavigationMenu>
        <NavigationMenuList>
          {/* Our Features */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-foreground/80 hover:text-primary">
              {featuresMenu.title}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="p-6 min-w-[600px]">
                <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${featuresMenu.columns?.length}, minmax(250px, 1fr))` }}>
                  {featuresMenu.columns?.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.items.map((item, itemIndex) => {
                        const IconComponent = item.icon ? Icons[item.icon] as React.ComponentType<{ className: string }> : null;
                        return (
                          <NavigationMenuLink key={itemIndex} asChild>
                            <Link href={item.href} className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent/50 transition-colors group block">
                              {IconComponent && (
                                <div className="flex-shrink-0 mt-1 text-primary">
                                  <IconComponent className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-foreground group-hover:text-primary">
                                  {item.title}
                                </div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Research */}
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/research" className="inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors">
                Research
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}