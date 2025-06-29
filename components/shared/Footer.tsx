import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-white text-black py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
        <span className="text-sm text-black">
          © 2025 LocalCityWalks | Made with{" "}
          <span aria-label="love" role="img">
            ❤️
          </span>{" "}
          in Spain.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
