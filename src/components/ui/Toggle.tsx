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
    <div className={`inline-flex rounded-full bg-background-secondary p-1 text-xs ${className} dark:bg-background-secondary`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-w-[64px] rounded-full px-3 py-1 text-center transition-colors ${
              active 
                ? "bg-button-primary text-button-primary-text shadow-sm dark:bg-button-primary dark:text-button-primary-text"
                : "text-text-secondary hover:text-text dark:text-text-secondary dark:hover:text-text"
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
