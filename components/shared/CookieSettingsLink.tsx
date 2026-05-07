"use client";

type CookieSettingsLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export default function CookieSettingsLink({
  className,
  children,
}: CookieSettingsLinkProps) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className={className}
    >
      {children}
    </a>
  );
}

