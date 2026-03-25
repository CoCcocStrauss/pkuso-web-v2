"use client";

import React from "react";

type Option = { value: string; label: React.ReactNode; minWidth?: string };

type ToggleProps = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

export default function Toggle({ options, value, onChange, className = "" }: ToggleProps) {
  return (
    <div className={`inline-flex rounded-full bg-zinc-100 p-1 text-xs ${className} dark:bg-zinc-800`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-w-[64px] rounded-full px-3 py-1 text-center transition-colors ${
              active 
                ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
            style={opt.minWidth ? { minWidth: opt.minWidth } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
