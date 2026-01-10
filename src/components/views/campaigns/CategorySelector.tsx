"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import React from "react";

export interface CategoryItem {
  name: string;
  count: number;
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  selectedCategory?: string;
  onSelectCategory: (category: string | undefined) => void;
  isLoading?: boolean;
  displayStyle?: "pill" | "card";
}

export function CategorySelector({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading = false,
  displayStyle = "pill",
}: CategorySelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    selectedCategory
  );
  useEffect(() => {
    setActiveCategory(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (category: string | undefined) => {
    setActiveCategory(category);
    onSelectCategory(category);
  };

  // Default categories if none are provided
  const defaultCategories: CategoryItem[] = [
    { name: "Medio ambiente", count: 42 },
    { name: "Educación", count: 35 },
    { name: "Salud", count: 28 },
    { name: "Igualdad", count: 21 },
    { name: "Cultura y arte", count: 15 },
    { name: "Emergencia", count: 12 },
  ];

  // Use provided categories or defaults if empty
  const displayCategories =
    categories.length > 0 ? categories : defaultCategories;

  // Helper function to get the correct icon for a category
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Medio ambiente":
        return (
          <Image
            src="/icons/nature.svg"
            alt="Medio ambiente"
            width={24}
            height={24}
          />
        );
      case "Educación":
        return (
          <Image
            src="/icons/book_2.svg"
            alt="Educación"
            width={24}
            height={24}
          />
        );
      case "Salud":
        return (
          <Image
            src="/icons/health_metrics.svg"
            alt="Salud"
            width={24}
            height={24}
          />
        );
      case "Igualdad":
        return (
          <Image
            src="/icons/diversity_4.svg"
            alt="Igualdad"
            width={24}
            height={24}
          />
        );
      case "Cultura y arte":
        return (
          <Image
            src="/icons/palette.svg"
            alt="Cultura y arte"
            width={24}
            height={24}
          />
        );
      case "Emergencia":
        return (
          <Image
            src="/icons/e911_emergency.svg"
            alt="Emergencia"
            width={24}
            height={24}
          />
        );
      default:
        return (
          <Image
            src="/icons/view_cozy.svg"
            alt="Categoría"
            width={24}
            height={24}
          />
        );
    }
  };

  return (
    <div className="mt-16">
      {/* Mobile horizontal scroll for pills */}
      <div className="block lg:hidden mb-8">
        <h3 className="text-xl font-bold text-[#333333] mb-4 px-4">
          Filtrar por categorías
        </h3>
        <div className="px-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`flex-shrink-0 px-4 py-2 border-2 rounded-full transition-all text-sm font-medium whitespace-nowrap touch-manipulation select-none ${
                activeCategory === undefined
                  ? "border-[#2c6e49] bg-[#2c6e49] text-white"
                  : "border-gray-300 hover:border-[#2c6e49] text-[#333333] bg-white"
              }`}
              disabled={isLoading}
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "manipulation",
              }}
            >
              <div className="flex items-center gap-1">
                <div className="w-4 h-4">
                  <Image
                    src="/icons/view_cozy.svg"
                    alt="Todas"
                    width={16}
                    height={16}
                    className={
                      activeCategory === undefined ? "brightness-0 invert" : ""
                    }
                    draggable={false}
                  />
                </div>
                <span>Todos</span>
              </div>
            </button>

            {isLoading ? (
              <div className="flex items-center justify-center px-4 py-2 border-2 border-gray-200 rounded-full flex-shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-[#2c6e49]" />
                <span className="ml-2 text-gray-500 text-sm">Cargando...</span>
              </div>
            ) : (
              displayCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`flex-shrink-0 px-4 py-2 border-2 rounded-full transition-all text-sm font-medium whitespace-nowrap touch-manipulation select-none ${
                    activeCategory === category.name
                      ? "border-[#2c6e49] bg-[#2c6e49] text-white"
                      : "border-gray-300 hover:border-[#2c6e49] text-[#333333] bg-white"
                  }`}
                  disabled={isLoading}
                  style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    touchAction: "manipulation",
                  }}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4">
                      {React.cloneElement(getCategoryIcon(category.name), {
                        draggable: false,
                      })}
                    </div>
                    <span>{category.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Desktop version - original layout */}
      <div className="hidden lg:block">
        <div
          className={`flex flex-wrap justify-center ${displayStyle === "card" ? "gap-6" : "gap-4"}`}
        >
          {displayStyle === "pill" ? (
            <>
              <button
                onClick={() => handleCategoryClick(undefined)}
                className={`px-6 py-4 border-2 rounded-full transition-all ${
                  activeCategory === undefined
                    ? "border-[#2c6e49] bg-[#2c6e49] text-white"
                    : "border-gray-300 hover:border-[#2c6e49] text-[#333333]"
                }`}
                disabled={isLoading}
              >
                Todas las categorías
              </button>

              {isLoading ? (
                <div className="flex items-center justify-center px-6 py-4 border-2 border-gray-200 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin text-[#2c6e49]" />
                  <span className="ml-2 text-gray-500">
                    Actualizando categorías...
                  </span>
                </div>
              ) : (
                displayCategories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`px-6 py-4 border-2 rounded-full transition-all flex items-center ${
                      activeCategory === category.name
                        ? "border-[#2c6e49] bg-[#2c6e49] text-white"
                        : "border-gray-300 hover:border-[#2c6e49] text-[#333333]"
                    }`}
                    disabled={isLoading}
                  >
                    <span>{category.name}</span>
                    <span className="ml-2 bg-white bg-opacity-20 text-sm px-2 py-0.5 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => handleCategoryClick(undefined)}
                className={`w-60 h-28 border-2 rounded-lg transition-all flex flex-col items-start justify-center px-6 ${
                  activeCategory === undefined
                    ? "border-[#2c6e49] bg-[#2c6e49] text-white"
                    : "border-gray-300 hover:border-[#2c6e49] text-[#333333] hover:bg-gray-50"
                }`}
                disabled={isLoading}
              >
                <Image
                  src="/icons/view_cozy.svg"
                  alt="Todas las categorías"
                  width={24}
                  height={24}
                  className={`mb-3 ${activeCategory === undefined ? "brightness-0 invert" : ""}`}
                />
                <span className="font-medium">Todas las categorías</span>
              </button>

              {isLoading ? (
                <div className="w-60 h-28 border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#2c6e49] mb-3" />
                  <span className="text-gray-500 text-center">
                    Actualizando categorías...
                  </span>
                </div>
              ) : (
                displayCategories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`w-60 h-28 border-2 rounded-lg transition-all flex flex-col items-start justify-center px-6 ${
                      activeCategory === category.name
                        ? "border-[#2c6e49] bg-[#2c6e49] text-white"
                        : "border-gray-300 hover:border-[#2c6e49] text-[#333333] hover:bg-gray-50"
                    }`}
                    disabled={isLoading}
                  >
                    <div
                      className={
                        activeCategory === category.name
                          ? "brightness-0 invert"
                          : ""
                      }
                    >
                      {getCategoryIcon(category.name)}
                    </div>
                    <div className="flex items-center gap-2 mt-3 mb-1">
                      <span className="font-medium">{category.name}</span>
                      <span
                        className={`text-sm ${activeCategory === category.name ? "text-white/90" : "text-gray-500"}`}
                      >
                        ({category.count})
                      </span>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
