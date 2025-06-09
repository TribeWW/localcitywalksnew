import Link from "next/link";
import React from "react";

const Header = () => {
  return (
    <div className="hidden px-4 sm:px-6 bg-transparant container mx-auto sm:flex">
      <div className="flex justify-between items-center mx-auto w-full py-4">
        <Link href={"/"} className="text-2xl font-bold">
          LocalCityWalks
        </Link>
        <div className="flex items-center gap-4">
          <Link href={"#about"}>About Us</Link>
          <Link href={"#contact"}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
