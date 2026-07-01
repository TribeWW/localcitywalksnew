/**
 * Section title + lead copy for checkout summary columns (LOC-1147).
 */

export interface CheckoutSectionHeadingProps {
  /** Section title, e.g. "Your details". */
  title: string;
  /** Supporting line below the title. */
  lead: string;
}

/**
 * Renders a checkout section heading with title and muted lead text.
 */
export function CheckoutSectionHeading({
  title,
  lead,
}: CheckoutSectionHeadingProps) {
  return (
    <div className="mb-5 space-y-2 sm:mb-6">
      <h2 className="text-lg font-semibold text-watermelon sm:text-xl">{title}</h2>
      <p className="text-sm text-muted-foreground">{lead}</p>
    </div>
  );
}
