/**
 * Guided-language extraction from Bókun product `guidanceTypes` (activity detail).
 *
 * Product `languages` is content translation — not used for the booking widget.
 * Guided options come from `guidanceTypes` where `guidanceType === "GUIDED"`.
 */

import { formatBokunLanguage } from "@/lib/utils/format-bokun-language";
import type {
  BokunGuidanceType,
  BookingWidgetLanguageOption,
} from "@/types/bokun";

/** Normalizes Bókun language codes for matching (`en`, `EN_GB` → `en`). */
export function normalizeBokunLanguageCode(code: string): string {
  const trimmed = code.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.split(/[_-]/)[0] ?? trimmed;
}

/**
 * Builds widget language options from product `guidanceTypes`.
 *
 * Uses parallel `languages` + `displayLanguages` arrays from the GUIDED entry.
 *
 * @param guidanceTypes - From `GET /activity.json/{id}`
 */
export function extractGuidedLanguagesFromGuidanceTypes(
  guidanceTypes: readonly BokunGuidanceType[] | undefined,
): BookingWidgetLanguageOption[] {
  if (!guidanceTypes?.length) {
    return [];
  }

  const guided = guidanceTypes.find(
    (entry) => entry.guidanceType?.toUpperCase() === "GUIDED",
  );
  if (!guided?.languages?.length) {
    return [];
  }

  const options: BookingWidgetLanguageOption[] = [];

  for (let index = 0; index < guided.languages.length; index += 1) {
    const code = guided.languages[index]?.trim();
    if (!code) continue;

    const displayLabel = guided.displayLanguages?.[index]?.trim();
    const label = displayLabel || formatBokunLanguage(code);

    if (options.some((option) => option.code === code)) {
      continue;
    }

    options.push({ code, label });
  }

  return options;
}

/**
 * Narrows product guided options to codes offered on the selected availability slot.
 *
 * @param slotLanguageCodes - `guidedLanguages` from the availability row
 * @param productOptions - From `extractGuidedLanguagesFromGuidanceTypes`
 */
export function resolveLanguageOptionsForSlot(
  slotLanguageCodes: readonly string[],
  productOptions: readonly BookingWidgetLanguageOption[],
): BookingWidgetLanguageOption[] {
  const productByNormalized = new Map(
    productOptions.map((option) => [
      normalizeBokunLanguageCode(option.code),
      option,
    ]),
  );

  const resolved: BookingWidgetLanguageOption[] = [];
  const seen = new Set<string>();

  for (const rawCode of slotLanguageCodes) {
    const code = rawCode.trim();
    if (!code) continue;

    const normalized = normalizeBokunLanguageCode(code);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const fromProduct = productByNormalized.get(normalized);
    if (fromProduct) {
      resolved.push({ code: fromProduct.code, label: fromProduct.label });
      continue;
    }

    const exactProduct = productOptions.find((option) => option.code === code);
    if (exactProduct) {
      resolved.push(exactProduct);
      continue;
    }

    resolved.push({ code, label: formatBokunLanguage(code) });
  }

  return resolved;
}
