"use client";

import type React from "react";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Authenticated } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface TopBarProps {
  children?: React.ReactNode;
}

export function TopBar({ children }: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {children}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients, appointments..."
            className="w-64 bg-secondary pl-9 lg:w-80"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>
    </header>
  );
}

