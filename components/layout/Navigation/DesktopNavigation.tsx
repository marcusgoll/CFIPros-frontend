"use client";

import React from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui";
import { featuresMenu } from "@/lib/config/navigation";

export function DesktopNavigation() {
  return (
    <div className="hidden items-center lg:flex">
      <NavigationMenu>
        <NavigationMenuList>
          {/* Our Features */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-foreground/80 hover:text-primary">
              {featuresMenu.title}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="min-w-[600px] p-6">
                <div
                  className="grid gap-8"
                  style={{
                    gridTemplateColumns: `repeat(${featuresMenu.columns?.length}, minmax(250px, 1fr))`,
                  }}
                >
                  {featuresMenu.columns?.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.items.map((item, itemIndex) => {
                        const IconComponent = item.icon
                          ? (Icons[item.icon] as React.ComponentType<{
                              className: string;
                            }>)
                          : null;
                        return (
                          <NavigationMenuLink key={itemIndex} asChild>
                            <Link
                              href={item.href}
                              className="hover:bg-accent/50 group block flex items-start space-x-3 rounded-md p-3 transition-colors"
                            >
                              {IconComponent && (
                                <div className="text-primary-600 mt-1 flex-shrink-0">
                                  <IconComponent className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-foreground group-hover:text-primary">
                                  {item.title}
                                </div>
                                {item.description && (
                                  <div className="mt-1 text-sm text-muted-foreground">
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
              <Link
                href="/research"
                className="text-foreground/80 inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
              >
                Research
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
