"use client";

import { EventCategory, categoryLabels, categoryIcons } from "@/types/event";

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

const categories: { value: string; label: string; icon: string }[] = [
  { value: "all", label: "All Events", icon: "🐴" },
  ...Object.entries(categoryLabels).map(([value, label]) => ({
    value,
    label,
    icon: categoryIcons[value as EventCategory],
  })),
];

export default function CategoryFilter({
  selected,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat.value
              ? "bg-saddle text-white shadow-md"
              : "bg-white text-stable-light border border-dust hover:border-saddle hover:text-saddle"
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
