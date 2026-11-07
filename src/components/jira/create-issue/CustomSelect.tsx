"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { DropdownOption } from "./types";

interface CustomSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder = "Оберіть зі списку...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-medium text-foreground block mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border text-foreground font-medium flex items-center justify-between transition-colors focus:outline-none focus:ring-1 focus:ring-primary select-none cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-card border border-border shadow-2xl p-1 z-50 max-h-56 overflow-y-auto animate-in fade-in-50 zoom-in-95">
          {options.map((opt, idx) => {
            if (opt.isHeader) {
              return (
                <div
                  key={`header-${idx}`}
                  className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/30 rounded mt-1.5 first:mt-0 select-none"
                >
                  {opt.label}
                </div>
              );
            }
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary/70"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
