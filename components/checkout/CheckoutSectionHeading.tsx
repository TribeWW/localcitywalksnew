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
    <div className="mb-6 space-y-2">
      <h2 className="text-xl font-semibold text-watermelon">{title}</h2>
      <p className="text-sm text-muted-foreground">{lead}</p>
    </div>
  );
}
