import { useState, useEffect } from "react";
import { ImproveTextButton } from "@/components/ui/improve-text-button";
import {
  CAMPAIGN_DESCRIPTION_MAX_LENGTH,
  CAMPAIGN_DESCRIPTION_MIN_LENGTH,
} from "@/lib/campaign-validation";

interface CampaignDescriptionInputProps {
  initialValue: string;
  onUpdate: (value: string) => void;
  error?: string;
}

export function CampaignDescriptionInput({
  initialValue,
  onUpdate,
  error,
}: CampaignDescriptionInputProps) {
  const [value, setValue] = useState(initialValue);

  // Sync from parent if initialValue changes externally
  // We compare with current value to avoid overwriting user input during race conditions,
  // but generally initialValue (formData.description) will lag behind value.
  // Actually, we should only sync if the parent resets the form.
  // For now, let's assume one-way sync from child to parent is the primary flow,
  // but if parent changes (e.g. strict reset), we might need to reflect it.
  // A simple useEffect on initialValue might cause loops if we aren't careful.
  // Given the usage, we can ignore upstream changes while typing.
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
  };

  // Debounced update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== initialValue) {
        onUpdate(value);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, onUpdate, initialValue]);

  return (
    <div className="relative" id="description">
      <label className="block text-lg font-medium mb-2">
        Descripción de la campaña
      </label>
      <textarea
        rows={4}
        placeholder="Ejemplo: Su conservación depende de nosotros"
        className={`w-full rounded-lg border ${
          error ? "error-input" : "border-black"
        } bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 p-4`}
        value={value}
        onChange={handleChange}
        onBlur={() => onUpdate(value)}
        minLength={CAMPAIGN_DESCRIPTION_MIN_LENGTH}
        maxLength={CAMPAIGN_DESCRIPTION_MAX_LENGTH}
      />
      <div className="flex justify-between items-center mt-1">
  <ImproveTextButton
  text={value}
  fieldType="description"
  maxLength={CAMPAIGN_DESCRIPTION_MAX_LENGTH}
  onAccept={(improved) => {
    setValue(improved);
    onUpdate(improved);
  }}
/>
  <span className="text-sm text-gray-500">
    Mín. {CAMPAIGN_DESCRIPTION_MIN_LENGTH} · {value.length}/
    {CAMPAIGN_DESCRIPTION_MAX_LENGTH}
  </span>
</div>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
