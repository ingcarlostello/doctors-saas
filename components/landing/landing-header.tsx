"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Zenticare</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonials
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/demo">Get a Demo 1</Link>
          </Button> */}
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(isScrolled && "lg:hidden")}
              >
                <Link href="#">
                  <span>Login</span>
                </Link>
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button
                asChild
                size="sm"
                className={cn(isScrolled && "lg:hidden")}
              >
                <Link href="#">
                  <span>Sign Up</span>
                </Link>
              </Button>
            </SignUpButton>

            <SignUpButton mode="modal">
              <Button
                asChild
                size="sm"
                className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
              >
                <Link href="#">
                  <span>Get Started</span>
                </Link>
              </Button>
            </SignUpButton>
          </Unauthenticated>
          <Authenticated>
            <Button>
              <Link href="/dashboard">
                <span>Dashboard</span>
              </Link>
            </Button>
            <UserButton />
          </Authenticated>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground"
            >
              How it Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground"
            >
              Testimonials
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/demo">Get a Demo 2</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
