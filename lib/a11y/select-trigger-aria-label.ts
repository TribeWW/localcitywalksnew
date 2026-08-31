/**
 * Builds an accessible name for a closed select trigger.
 *
 * @param fieldLabel - Field label or placeholder fallback
 * @param selectedLabel - Display label for the current value, if any
 */
export function buildSelectTriggerAriaLabel(
  fieldLabel: string,
  selectedLabel?: string | null,
): string {
  const label = fieldLabel.trim();
  const selected = selectedLabel?.trim();
  return selected ? `${label}, ${selected}` : label;
}
