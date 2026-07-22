"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * cars.com-signature form control: bordered box with a tiny floating label
 * above the bold value, chevron at the end. Used for hero search, SRP sort,
 * and dealer-inventory filters. `joined` removes rounding/doubled borders so
 * a vertical stack reads as one grouped widget.
 */
export function LabeledSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  joined = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  joined?: boolean;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        className={cn(
          "border border-[#D9D9E0] bg-white px-3 pt-1.5 pb-1 transition-colors focus-within:border-[#8136B2] focus-within:ring-1 focus-within:ring-[#8136B2]",
          joined ? "rounded-none" : "rounded-md",
        )}
      >
        <label className="block text-[10px] leading-tight text-[#63666A]">
          {label}
        </label>
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          suppressHydrationWarning
          className="w-full appearance-none bg-transparent pe-6 text-sm font-medium text-[#141414] outline-none disabled:text-muted cursor-pointer truncate"
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <ChevronDown className="pointer-events-none absolute end-3 bottom-2.5 h-4 w-4 text-[#141414]" />
    </div>
  );
}
