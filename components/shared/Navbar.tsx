"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const BROWSE_HREF = "/#cities";

/**
 * Top navigation bar that renders the site logo, a "Browse tours" action, and a responsive mobile slide-out menu.
 *
 * Tracks page scroll to conditionally apply a shadow to the sticky header and manages the mobile menu open/close state.
 *
 * @returns The navigation header JSX element.
 */
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const browseClassName = cn(
    "flex h-9 items-center rounded-lg bg-tangerine px-4 text-sm font-medium text-white",
    "hover:bg-grapefruit whitespace-nowrap transition-colors duration-200",
  );

  return (
    <header className="relative z-40 w-full font-sans">
      <div
        className={cn(
          "sticky top-0 w-full border-b border-border bg-white transition-all duration-300",
          isScrolled && "shadow-[0px_4px_4px_rgba(0,0,0,0.05)]",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex flex-shrink-0 items-center gap-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 rounded-md text-watermelon hover:bg-pearl-gray lg:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className={cn(
                  "w-[85%] max-w-[320px] gap-0 border-border p-0 shadow-2xl",
                  "data-[state=closed]:duration-300 data-[state=open]:duration-300",
                  "[&>button]:hidden",
                )}
              >
                <div className="flex h-full flex-col">
                  <SheetHeader className="space-y-0 border-b border-border p-4">
                    <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                    <div className="flex items-center justify-between">
                      <SheetClose asChild>
                        <Link href="/" className="block">
                          <Image
                            src="/logo-long-dark.svg"
                            alt="LocalCityWalks"
                            width={173}
                            height={40}
                            className="h-7 w-auto"
                          />
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:bg-pearl-gray hover:text-watermelon"
                          aria-label="Close menu"
                        >
                          <XIcon className="size-6" />
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-4 py-6">
                    <SheetClose asChild>
                      <Link
                        href={BROWSE_HREF}
                        className={cn(
                          browseClassName,
                          "w-full justify-center text-[15px]",
                        )}
                      >
                        Browse tours
                      </Link>
                    </SheetClose>
                  </div>

                  <div className="border-t border-border bg-pearl-gray p-4">
                    <p className="text-center text-xs text-muted-foreground">
                      © {new Date().getFullYear()} LocalCityWalks. All rights
                      reserved.
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link
              href="/"
              className="flex-shrink-0 transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo-long-dark.svg"
                alt="LocalCityWalks"
                width={173}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <div className="flex flex-shrink-0 items-center">
            <Link href={BROWSE_HREF} className={cn(browseClassName, "hidden lg:flex")}>
              Browse tours
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
