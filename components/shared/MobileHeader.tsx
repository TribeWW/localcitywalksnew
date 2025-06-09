"use client";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const MobileHeader = () => {
  return (
    <div className="px-4 sm:px-6 bg-transparant sm:hidden">
      <div className="flex justify-between items-center mx-auto w-full py-4">
        <Link href={"/"} className="text-2xl font-bold">
          LocalCityWalks
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="default" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>
              <Link href={"/"} className="text-2xl font-bold">
                LocalCityWalks
              </Link>
            </SheetTitle>
            <div className="flex flex-col gap-4 p-4 justify-center items-center">
              <SheetClose asChild>
                <Link
                  href="#about"
                  className="hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileHeader;
