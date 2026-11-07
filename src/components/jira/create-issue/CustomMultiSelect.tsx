"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CustomMultiSelectProps {
  label: string;
  selectedValues: string[];
  options: string[];
  onChange: (newValues: string[]) => void;
  placeholder?: string;
  emptyNotice?: string;
  badgeClass?: string;
}

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  label,
  selectedValues,
  options,
  onChange,
  placeholder = "Оберіть зі списку...",
  emptyNotice = "Немає доступних варіантів у довіднику",
  badgeClass = "bg-secondary text-foreground border border-border",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter((v) => v !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
  };

  const removeValue = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== opt));
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-medium text-foreground block mb-1">
        {label}
      </label>

      {/* Trigger Area */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[38px] text-xs py-1.5 px-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border text-foreground flex items-center justify-between transition-colors focus-within:ring-1 focus-within:ring-primary select-none cursor-pointer gap-2"
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 py-0.5">
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedValues.map((val) => (
              <span
                key={val}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${badgeClass}`}
              >
                <span>{val}</span>
                <span
                  role="button"
                  onClick={(e) => removeValue(val, e)}
                  className="hover:text-destructive transition-colors ml-0.5 cursor-pointer font-bold"
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-card border border-border shadow-2xl p-1 z-50 max-h-56 overflow-y-auto animate-in fade-in-50 zoom-in-95">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              {emptyNotice}
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = selectedValues.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-foreground hover:bg-secondary/70"
                  }`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
