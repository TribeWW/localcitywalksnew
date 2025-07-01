"use client";
import Link from "next/link";
import React from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import Image from "next/image";
import { NAV_LINKS } from "@/constants";

const MobileHeader = () => {
  return (
    <div className="px-4 sm:px-6 bg-transparant sm:hidden">
      <div className="flex justify-between items-center mx-auto w-full py-4">
        <Link href={"/"} className="text-2xl font-bold">
          <Image
            src={"/logo-long-dark.svg"}
            alt="LocalCityWalks"
            width={173}
            height={40}
          />
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <div className="h-6 w-6 flex items-center justify-center cursor-pointer text-watermelon">
              <Menu className="h-6 w-6" />
            </div>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="p-4">
              <Link href={"/"} className="">
                <Image
                  src={"/logo-long-dark.svg"}
                  alt="LocalCityWalks"
                  width={173}
                  height={40}
                />
              </Link>
            </SheetTitle>
            <div className="flex flex-col gap-4 p-4 justify-center items-center">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileHeader;
