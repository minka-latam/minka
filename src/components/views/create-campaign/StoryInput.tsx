import { useState, useEffect } from "react";

interface StoryInputProps {
  initialValue: string;
  onUpdate: (value: string) => void;
  error?: string;
}

export function StoryInput({ initialValue, onUpdate, error }: StoryInputProps) {
  const [value, setValue] = useState(initialValue);

  // Sync from parent if initialValue changes externally
  // We compare with current value to avoid overwriting user input during race conditions,
  // but generally initialValue (formData.story) will lag behind value.
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
    <div className="relative" id="story">
      <label className="block text-lg font-medium mb-2">
        Presentación de la campaña (historia)
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
        maxLength={600}
      />
      <div className="text-sm text-gray-500 text-right mt-1">
        {value.length}/600
      </div>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
