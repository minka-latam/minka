"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "todas", label: "Todas" },
  { id: "cultura", label: "Cultura y arte" },
  { id: "educacion", label: "Educación" },
  { id: "emprendimiento", label: "Emprendimiento" },
  { id: "igualdad", label: "Igualdad" },
  { id: "medioambiente", label: "Medio ambiente" },
  { id: "salud", label: "Salud" },
];

export function CategoryPills() {
  const [selectedCategory, setSelectedCategory] = useState("todas");

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          onClick={() => setSelectedCategory(category.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm transition-colors",
            selectedCategory === category.id
              ? "bg-[#2c6e49] text-white"
              : "bg-[#e8f0e9] text-[#2c6e49] hover:bg-[#d1e3d5]"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
