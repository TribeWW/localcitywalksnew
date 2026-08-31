/**
 * Section title + lead copy for contact form areas.
 */

export interface ContactSectionHeadingProps {
  /** Section title, e.g. "Send us a message". */
  title: string;
  /** Supporting line below the title. */
  lead: string;
}

/**
 * Renders a contact section heading with title and muted lead text.
 */
export function ContactSectionHeading({
  title,
  lead,
}: ContactSectionHeadingProps) {
  return (
    <div className="mb-6 space-y-2">
      <h2 className="text-lg font-semibold text-nightsky sm:text-xl">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{lead}</p>
    </div>
  );
}
