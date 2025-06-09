import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-black text-white py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-lg font-semibold tracking-wide">
          &copy; 2025 LocalCityWalks
        </span>
        <span className="text-sm text-gray-300">
          Made with{" "}
          <span aria-label="love" role="img">
            ❤️
          </span>{" "}
          for real city stories.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
