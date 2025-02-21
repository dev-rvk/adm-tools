"use client";

import Link from "next/link";
import { Smartphone, Bolt, Wrench, Brain } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@repo/ui/components/ui/navigation-menu";

export function NavBar() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto flex h-20 items-center px-6">
        <div className="flex items-center space-x-3">
          <Smartphone className="h-8 w-8 text-slate-700 dark:text-slate-300" />
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Android FARM
          </span>
        </div>
        <NavigationMenu className="ml-auto">
          <NavigationMenuList className="space-x-4">
            <NavigationMenuItem>
              <Link href="https://connect-device-url.com" legacyBehavior passHref>
                <NavigationMenuLink className="flex items-center px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Bolt className="mr-2 h-5 w-5" />
                  <span>Connect Device</span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="https://tools-url.com" legacyBehavior passHref>
                <NavigationMenuLink className="flex items-center px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Wrench className="mr-2 h-5 w-5" />
                  <span>Tools</span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link href="https://ai-analysis-url.com" legacyBehavior passHref>
                <NavigationMenuLink className="flex items-center px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Brain className="mr-2 h-5 w-5" />
                  <span>AI Analysis</span>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
