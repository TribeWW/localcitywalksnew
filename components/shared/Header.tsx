import Link from "next/link";
import React from "react";
import Image from "next/image";
import { NAV_LINKS } from "@/constants";

const Header = () => {
  return (
    <div className="hidden px-4 md:px-8 xl:px-0 bg-transparant max-w-6xl mx-auto sm:flex">
      <div className="flex justify-between items-center mx-auto w-full py-4">
        <Link href={"/"} className="text-2xl font-bold">
          <Image
            src={"/logo-long-dark.svg"}
            alt="LocalCityWalks"
            width={150}
            height={100}
          />
        </Link>
        <div className="flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;
