"use client";

/**
 * Guided-language dropdown for the booking widget (LOC-1051).
 *
 * Maps Bókun codes (e.g. `EN_GB`) to human labels via `formatBokunLanguage`.
 * Used when the selected slot exposes `guidedLanguages`, else product `languages`.
 */

import { cn } from "@/lib/utils";
import { formatBokunLanguage } from "@/lib/utils/format-bokun-language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Props for `LanguageSelector`. */
interface LanguageSelectorProps {
  /** Selected Bókun language code. */
  value?: string;
  /** Called with the raw code when the user picks a language. */
  onChange: (language: string | undefined) => void;
  /** Bókun codes from slot `guidedLanguages` or product `languages`. */
  languages: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Select control for tour guided language; dedupes and trims incoming codes.
 *
 * @param props.languages - Bókun codes from slot or product metadata
 */
const LanguageSelector = ({
  value,
  onChange,
  languages,
  placeholder = "Select language",
  disabled = false,
  className,
}: LanguageSelectorProps) => {
  const uniqueLanguages = [...new Set(languages.map((code) => code.trim()).filter(Boolean))];

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || uniqueLanguages.length === 0}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {uniqueLanguages.map((code) => (
          <SelectItem key={code} value={code}>
            {formatBokunLanguage(code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
