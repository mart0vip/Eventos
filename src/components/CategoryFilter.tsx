"use client";

import { EventCategory, categoryIcons } from "@/types/event";
import { useLanguage } from "@/i18n/LanguageContext";

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

const categoryValues: EventCategory[] = [
  "show-jumping",
  "dressage",
  "cross-country",
  "polo",
  "rodeo",
  "trail-ride",
  "clinic",
  "auction",
  "social",
  "other",
];

export default function CategoryFilter({
  selected,
  onChange,
}: CategoryFilterProps) {
  const { t } = useLanguage();

  const categories = [
    { value: "all", label: t("categories.all"), icon: "🐴" },
    ...categoryValues.map((value) => ({
      value,
      label: t(`categories.${value}`),
      icon: categoryIcons[value],
    })),
  ];

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
