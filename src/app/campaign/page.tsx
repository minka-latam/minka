"use client";

import { CategorySelector } from "@/components/views/campaigns/CategorySelector";
import { FilterSidebar } from "@/components/views/campaigns/FilterSidebar";
import { MobileFilterModal } from "@/components/views/campaigns/MobileFilterModal";
import { CampaignCard } from "@/components/views/campaigns/CampaignCard";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import { EnhancedPagination } from "@/components/ui/enhanced-pagination";
import { ChevronDown, Search, Filter } from "lucide-react";
import { useState, useEffect, Suspense, memo, useRef } from "react";
import { useCampaignBrowse, SortOption } from "@/hooks/use-campaign-browse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Loading component for Suspense
function CampaignsLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-[#2c6e49] font-medium text-lg">
        Cargando campañas...
      </p>
    </div>
  );
}

// Memoized Campaign Results component that will only re-render when its props change
const CampaignResults = memo(function CampaignResults({
  campaigns,
  error,
  isLoading,
  pagination,
  resultsTitle,
  sortOptions,
  sortBy,
  goToPage,
  updateSort,
  onResetFilters,
}: {
  campaigns: any[];
  error: string | null;
  isLoading: boolean;
  pagination: { currentPage: number; totalPages: number; totalCount: number };
  resultsTitle: string;
  sortOptions: SortOption[];
  sortBy: string;
  goToPage: (page: number) => void;
  updateSort: (sort: string) => void;
  onResetFilters: () => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 400); // 400ms delay to make it less sensitive
  };

  const selectOption = (option: SortOption) => {
    updateSort(option.id);
    setIsDropdownOpen(false);
  };

  // Find the selected sort option label
  const selectedSortOption =
    sortOptions.find((option) => option.id === sortBy) || sortOptions[0];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
        <LoadingSpinner size="lg" />
        <p className="pt-10 mt-4 text-[#2c6e49] font-medium text-lg">
          Cargando campañas...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[#333333]">{resultsTitle}</h2>
          <p className="text-xl text-[#555555]">
            {pagination.totalCount} Resultados
          </p>
        </div>

        <div className="relative mt-4 sm:mt-0">
          <div className="flex items-center">
            <span className="mr-3 text-[#555555] font-medium">
              Ordenar por:
            </span>
            <div 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={toggleDropdown}
                className="flex items-center justify-between bg-transparent py-2 px-4 min-w-[160px] text-[#333333] font-medium focus:outline-none"
                disabled={isLoading}
              >
                <span>{selectedSortOption.label}</span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-600 ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectOption(option)}
                      className={`block w-full text-left px-4 py-2 hover:bg-[#e9ebd8] ${
                        sortBy === option.id
                          ? "text-[#2c6e49] font-medium"
                          : "text-[#333333]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {campaigns.length > 0 ? (
        <div
          className={`transition-opacity duration-300 ${isLoading ? "opacity-60" : "opacity-100"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 lg:px-0">
            {campaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className="animate-fadeIn"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "both",
                }}
              >
                <CampaignCard
                  id={campaign.id}
                  title={campaign.title}
                  image={campaign.primaryImage || ""}
                  category={campaign.category}
                  location={campaign.location as any}
                  progress={campaign.percentageFunded}
                  verified={campaign.verified}
                  description={campaign.description}
                  donorCount={campaign.donorCount}
                  amountRaised={`Bs. ${campaign.collectedAmount.toLocaleString("es-BO")}`}
                />
              </div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          <EnhancedPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            onPageChange={goToPage}
            isLoading={isLoading}
            className="mt-12"
          />
        </div>
      ) : !isLoading ? (
        <div className="text-center py-16 rounded-lg">
          <p className="text-xl text-gray-600 mb-4">
            No se encontraron campañas con estos filtros.
          </p>
          <Button
            onClick={onResetFilters}
            className="bg-[#2c6e49] hover:bg-[#2c6e49]/90"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
});

// Main campaign content component that uses useSearchParams
function CampaignsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Get category from URL if it exists
  const categoryFromUrl = searchParams.get("category");

  // Initialize the campaign browse hook
  const {
    campaigns,
    isLoading,
    error,
    categories,
    locations,
    isCategoriesLoading,
    isLocationsLoading,
    filters,
    sortBy,
    sortOptions,
    pagination,
    updateFilters,
    updateSort,
    goToPage,
    resetFilters,
  } = useCampaignBrowse();

  // This function maps display names to DB enum values for categories
  const mapCategoryToEnum = (displayName: string): string => {
    const categoryMap: Record<string, string> = {
      "Cultura y arte": "cultura_arte",
      Educación: "educacion",
      Emergencia: "emergencia",
      Igualdad: "igualdad",
      "Medio ambiente": "medioambiente",
      Salud: "salud",
      Otros: "otros",
    };

    return categoryMap[displayName] || displayName;
  };

  // This function maps DB enum values to display names for categories
  const mapEnumToCategory = (enumValue: string): string => {
    const displayMap: Record<string, string> = {
      cultura_arte: "Cultura y arte",
      educacion: "Educación",
      emergencia: "Emergencia",
      igualdad: "Igualdad",
      medioambiente: "Medio ambiente",
      salud: "Salud",
      otros: "Otros",
    };

    return displayMap[enumValue] || enumValue;
  };

  // This function maps display names to DB enum values for locations
  const mapLocationToEnum = (displayName: string): string => {
    const locationMap: Record<string, string> = {
      "La Paz": "la_paz",
      "Santa Cruz": "santa_cruz",
      Cochabamba: "cochabamba",
      Sucre: "sucre",
      Oruro: "oruro",
      Potosí: "potosi",
      Tarija: "tarija",
      Beni: "beni",
      Pando: "pando",
    };

    return locationMap[displayName] || displayName;
  };

  // This function maps DB enum values to display names for locations
  const mapEnumToLocation = (enumValue: string): string => {
    const displayMap: Record<string, string> = {
      la_paz: "La Paz",
      santa_cruz: "Santa Cruz",
      cochabamba: "Cochabamba",
      sucre: "Sucre",
      oruro: "Oruro",
      potosi: "Potosí",
      tarija: "Tarija",
      beni: "Beni",
      pando: "Pando",
    };

    return displayMap[enumValue] || enumValue;
  };

  // Convert any category from URL to its DB enum value
  useEffect(() => {
    if (categoryFromUrl) {
      // If the category is a display name, map it to enum value
      const enumValue = mapCategoryToEnum(categoryFromUrl);
      console.log(
        `Setting initial category from URL: ${categoryFromUrl} -> ${enumValue}`
      );
      updateFilters({ category: enumValue });
    }
  }, [categoryFromUrl, updateFilters]);

  // Sync mobile search query with filter state
  useEffect(() => {
    if (filters.search) {
      setSearchQuery(filters.search);
    } else {
      setSearchQuery("");
    }
  }, [filters.search]);

  // Modified function to handle category selection
  const handleCategorySelect = (category: string | undefined) => {
    if (category) {
      // Convert display name to enum value for DB query
      const enumValue = mapCategoryToEnum(category);
      console.log(`Selected category: ${category} -> ${enumValue}`);
      updateFilters({ category: enumValue });
    } else {
      updateFilters({ category: undefined });
    }
  };

  // Enhanced reset function to clear search and all filters
  const handleResetFilters = () => {
    console.log("Resetting all filters and search");
    // Clear search input
    setSearchQuery("");
    // Reset all filters in the hook
    resetFilters();
  };

  // Mobile search functionality
  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    updateFilters({ search: trimmedQuery || undefined });
  };

  const handleMobileSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleMobileSearchClear = () => {
    setSearchQuery("");
    updateFilters({ search: undefined });
  };

  // Helper to get display name for UI selection state
  const getDisplayCategory = (category?: string): string | undefined => {
    if (!category) return undefined;
    return mapEnumToCategory(category);
  };

  // Helper to get display names for UI selection state
  const getDisplayLocations = (
    locations?: string[],
    location?: string
  ): string[] => {
    const selectedLocations =
      locations && locations.length > 0
        ? locations
        : location
          ? [location]
          : [];
    return selectedLocations.map((selectedLocation) =>
      mapEnumToLocation(selectedLocation)
    );
  };

  // Helper to get display title for the results section
  const getResultsTitle = () => {
    if (filters.search) {
      return `Resultados para "${filters.search}"`;
    }

    if (filters.category) {
      const displayCategory = getDisplayCategory(filters.category);
      return `Campañas en ${displayCategory}`;
    }

    return "Todas las campañas";
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#ECF1DC]">
      <Header />
      <div className="pt-24">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#333333] mb-6">
              Apoya una causa,
              <br />
              cambia una vida
            </h1>
            <p className="text-2xl md:text-3xl text-[#555555] max-w-3xl mx-auto mb-12">
              Explora todas las campañas activas o encuentra las de tu interés
              según categoría.
            </p>
          </div>

          <CategorySelector
            categories={categories}
            selectedCategory={getDisplayCategory(filters.category)}
            onSelectCategory={handleCategorySelect}
            isLoading={isCategoriesLoading}
            displayStyle="card"
          />

          {/* Mobile Search and Filter Section */}
          <div className="block lg:hidden mt-8 mb-8">
            <div className="space-y-4">
              {/* Results Title */}
              <div className="px-4">
                <h2 className="text-3xl font-bold text-[#333333]">
                  {getResultsTitle()}
                </h2>
                <p className="text-xl text-[#555555]">
                  {pagination.totalCount} Resultados
                </p>
              </div>

              {/* Search Bar - Full Width */}
              <div className="px-4">
                <form onSubmit={handleMobileSearch} className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar campañas"
                      className="w-full h-12 px-4 pl-10 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a5535] focus:border-transparent"
                      value={searchQuery}
                      onChange={handleMobileSearchChange}
                    />
                    <div className="absolute left-3 top-3.5">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleMobileSearchClear}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Filter Button and Sort Dropdown */}
              <div className="px-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="flex items-center justify-center h-12 px-6 bg-[#2c6e49] text-white rounded-full font-medium hover:bg-[#2c6e49]/90 transition-colors whitespace-nowrap"
                  >
                    <Filter size={18} className="mr-2" />
                    Filtrar
                  </button>

                  <div className="relative flex-1">
                    <select
                      value={sortBy}
                      onChange={(e) => updateSort(e.target.value)}
                      className="w-full h-12 appearance-none bg-transparent border-0 rounded-full px-4 pr-10 focus:outline-none focus:ring-0 focus:border-transparent text-[#333333]"
                    >
                      {!sortBy && (
                        <option value="" disabled>
                          Ordenar por
                        </option>
                      )}
                      {sortOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="flex flex-col lg:flex-row gap-10 mt-16">
            <div className="hidden lg:block">
              <FilterSidebar
                locations={locations}
                filters={{
                  ...filters,
                  location: undefined,
                  locations: getDisplayLocations(
                    filters.locations,
                    filters.location
                  ),
                }}
                onUpdateFilters={(newFilters) => {
                  // Handle all filter updates properly
                  const processedFilters: any = { ...newFilters };

                  // Special handling for multi-location filter
                  if (newFilters.locations !== undefined) {
                    processedFilters.locations =
                      newFilters.locations.length > 0
                        ? newFilters.locations.map((selectedLocation) =>
                            mapLocationToEnum(selectedLocation)
                          )
                        : undefined;
                    processedFilters.location = undefined;
                  }

                  // For all other filters (including createdAfter, fundingPercentageMin, fundingPercentageMax)
                  // pass them through directly as they're already in the correct format
                  updateFilters(processedFilters);
                }}
                onResetFilters={handleResetFilters}
                isLocationsLoading={isLocationsLoading}
              />
            </div>

            {/* This is the only part that will reload when filters change */}
            <CampaignResults
              campaigns={campaigns}
              error={error}
              isLoading={isLoading}
              pagination={pagination}
              resultsTitle={getResultsTitle()}
              sortOptions={sortOptions}
              sortBy={sortBy}
              goToPage={goToPage}
              updateSort={updateSort}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Mobile Filter Modal */}
          <MobileFilterModal
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            locations={locations}
            filters={{
              ...filters,
              location: undefined,
              locations: getDisplayLocations(filters.locations, filters.location),
            }}
            onUpdateFilters={(newFilters) => {
              // Handle all filter updates properly
              const processedFilters: any = { ...newFilters };

              // Special handling for multi-location filter
              if (newFilters.locations !== undefined) {
                processedFilters.locations =
                  newFilters.locations.length > 0
                    ? newFilters.locations.map((selectedLocation) =>
                        mapLocationToEnum(selectedLocation)
                      )
                    : undefined;
                processedFilters.location = undefined;
              }

              // For all other filters
              updateFilters(processedFilters);
            }}
            onResetFilters={handleResetFilters}
            isLocationsLoading={isLocationsLoading}
          />
        </main>
        <Footer />
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function CampaignsPage() {
  return (
    <Suspense fallback={<CampaignsLoading />}>
      <CampaignsContent />
    </Suspense>
  );
}
