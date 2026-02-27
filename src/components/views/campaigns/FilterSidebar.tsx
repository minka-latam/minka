"use client";

import {
  useState,
  useEffect,
  Suspense,
  memo,
  useCallback,
  useRef,
} from "react";
import Image from "next/image";
import { CampaignFilters } from "@/hooks/use-campaign-browse";
import { Loader2, X } from "lucide-react";

export interface LocationItem {
  name: string;
  count: number;
}

interface FilterSidebarProps {
  locations: LocationItem[];
  filters: CampaignFilters;
  onUpdateFilters: (newFilters: Partial<CampaignFilters>) => void;
  onResetFilters: () => void;
  isLocationsLoading?: boolean;
}

export function FilterSidebar({
  locations,
  filters,
  onUpdateFilters,
  onResetFilters,
  isLocationsLoading = false,
}: FilterSidebarProps) {
  // Default locations if none are provided
  const defaultLocations: LocationItem[] = [
    { name: "La Paz", count: 45 },
    { name: "Santa Cruz", count: 38 },
    { name: "Cochabamba", count: 25 },
    { name: "Sucre", count: 12 },
    { name: "Oruro", count: 8 },
  ];

  // Use provided locations or defaults if empty
  const displayLocations = locations.length > 0 ? locations : defaultLocations;
  const selectedLocations =
    filters.locations && filters.locations.length > 0
      ? filters.locations
      : filters.location
        ? [filters.location]
        : [];

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);

  // Create a stable debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        const trimmedQuery = query.trim();
        onUpdateFilters({ search: trimmedQuery || undefined });
      }, 500);
    },
    [onUpdateFilters]
  );

  // Initialize searchQuery from filters
  useEffect(() => {
    isInitializingRef.current = true;
    if (filters.search) {
      setSearchQuery(filters.search);
    } else {
      setSearchQuery("");
    }
    isInitializingRef.current = false;
  }, [filters.search]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    // Only trigger search if we're not initializing from props
    if (!isInitializingRef.current) {
      debouncedSearch(newValue);
    }
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery("");
    debouncedSearch("");
  };

  // Handle search submission (for Enter key)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any pending debounced search and trigger immediately
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    const trimmedQuery = searchQuery.trim();
    onUpdateFilters({ search: trimmedQuery || undefined });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Reset internal filter states when filters are reset from parent
  useEffect(() => {
    // Reset creation date filter when createdAfter is undefined
    if (!filters.createdAfter) {
      setCreationDateFilter([]);
    }
  }, [filters.createdAfter]);

  useEffect(() => {
    // Reset amount raised filter when fundingPercentage filters are undefined
    if (
      filters.fundingPercentageMin === undefined &&
      filters.fundingPercentageMax === undefined
    ) {
      setAmountRaisedFilter([]);
    }
  }, [filters.fundingPercentageMin, filters.fundingPercentageMax]);

  useEffect(() => {
    // Reset verification status when verification filter is undefined
    if (!filters.verificationStatus && filters.verified === undefined) {
      setVerificationStatus([]);
    } else if (filters.verificationStatus) {
      // Map the API status back to UI status
      let uiStatus: string;
      if (filters.verificationStatus === "verified") {
        uiStatus = "verified";
      } else if (filters.verificationStatus === "pending") {
        uiStatus = "in_process";
      } else if (filters.verificationStatus === "unverified") {
        uiStatus = "unverified";
      } else {
        uiStatus = "";
      }

      if (uiStatus && !verificationStatus.includes(uiStatus)) {
        setVerificationStatus([uiStatus]);
      }
    } else if (filters.verified === true) {
      // Backward compatibility - if old verified=true is set
      if (!verificationStatus.includes("verified")) {
        setVerificationStatus(["verified"]);
      }
    }
  }, [filters.verificationStatus, filters.verified]);

  // Additional comprehensive reset when all filters are cleared
  useEffect(() => {
    // Check if filters object is completely empty or only has undefined values
    const hasAnyFilter = Object.values(filters).some(
      (value) =>
        value !== undefined && (!Array.isArray(value) || value.length > 0)
    );

    if (!hasAnyFilter) {
      // Reset all internal states when no filters are active
      setCreationDateFilter([]);
      setAmountRaisedFilter([]);
      setVerificationStatus([]);
      setSearchQuery("");
      console.log("All filters cleared - resetting UI states");
    }
  }, [filters]);

  // Handle verified filter change - now integrated with verification status
  const handleVerificationStatusChange = (status: string) => {
    // Single select behavior
    if (verificationStatus.includes(status)) {
      // If already selected, deselect it
      setVerificationStatus([]);
      onUpdateFilters({
        verificationStatus: undefined,
        verified: undefined,
      });
    } else {
      // If not selected, select it (and clear others)
      setVerificationStatus([status]);

      // Map to API status
      let selectedStatus: "verified" | "pending" | "unverified" = "verified";

      if (status === "verified") {
        selectedStatus = "verified";
      } else if (status === "in_process") {
        selectedStatus = "pending";
      } else if (status === "unverified") {
        selectedStatus = "unverified";
      }

      onUpdateFilters({
        verificationStatus: selectedStatus,
        verified: undefined, // clear old parameter
      });
    }
  };

  // Handle location changes as multi-select
  const handleLocationToggle = (location: string) => {
    const updatedLocations = selectedLocations.includes(location)
      ? selectedLocations.filter(
          (selectedLocation) => selectedLocation !== location
        )
      : [...selectedLocations, location];

    onUpdateFilters({
      locations: updatedLocations.length > 0 ? updatedLocations : undefined,
      location: undefined,
    });
  };

  const handleClearLocations = () => {
    onUpdateFilters({ locations: undefined, location: undefined });
  };

  // Verification status filter - now handles all verification states
  const [verificationStatus, setVerificationStatus] = useState<string[]>([]);

  // Creation date filter
  const [creationDateFilter, setCreationDateFilter] = useState<string[]>([]);

  const handleCreationDateChange = (filter: string) => {
    // Single select behavior
    if (creationDateFilter.includes(filter)) {
      // If already selected, deselect it
      setCreationDateFilter([]);
      onUpdateFilters({ createdAfter: undefined });
    } else {
      // If not selected, select it (and clear others)
      setCreationDateFilter([filter]);

      // Calculate a date for filtering based on selected options
      let createdAfter: string | undefined = undefined;
      const date = new Date();

      if (filter === "24h") {
        date.setHours(date.getHours() - 24);
        createdAfter = date.toISOString();
      } else if (filter === "7d") {
        date.setDate(date.getDate() - 7);
        createdAfter = date.toISOString();
      } else if (filter === "30d") {
        date.setDate(date.getDate() - 30);
        createdAfter = date.toISOString();
      }

      onUpdateFilters({ createdAfter });
    }
  };

  // Amount raised filter - for UI only, not implemented in backend yet
  const [amountRaisedFilter, setAmountRaisedFilter] = useState<string[]>([]);

  const handleAmountRaisedChange = (filter: string) => {
    // Single select behavior
    if (amountRaisedFilter.includes(filter)) {
      // If already selected, deselect it
      setAmountRaisedFilter([]);
      onUpdateFilters({
        fundingPercentageMin: undefined,
        fundingPercentageMax: undefined,
      });
    } else {
      // If not selected, select it (and clear others)
      setAmountRaisedFilter([filter]);

      let fundingPercentageMin: number | undefined = undefined;
      let fundingPercentageMax: number | undefined = undefined;

      if (filter === "less_25") {
        fundingPercentageMin = 0;
        fundingPercentageMax = 25;
      } else if (filter === "between_25_75") {
        fundingPercentageMin = 25;
        fundingPercentageMax = 75;
      } else if (filter === "more_75") {
        fundingPercentageMin = 75;
        fundingPercentageMax = 100;
      } else if (filter === "goal_reached") {
        fundingPercentageMin = 100;
      }

      onUpdateFilters({
        fundingPercentageMin,
        fundingPercentageMax,
      });
    }
  };

  return (
    <div className="w-full md:w-72 bg-transparent">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#333333]">
          Filtrar resultados
        </h2>
        <Image
          src="/icons/instant_mix.svg"
          alt="Filtros"
          width={24}
          height={24}
        />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar campañas"
              className="w-full h-12 px-4 pl-10 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a5535] focus:border-transparent"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {/* Search icon */}
            <div className="absolute left-3 top-3.5">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
                  fill="#6E6E6E"
                />
              </svg>
            </div>
            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
            <button type="submit" className="hidden">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Separator */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Location Section */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#333333] mb-4">Ubicación</h3>

        <div className="space-y-3">
          <div
            className="flex items-center cursor-pointer"
            onClick={handleClearLocations}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${selectedLocations.length === 0 ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {selectedLocations.length === 0 && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Todas las ubicaciones</span>
          </div>

          {isLocationsLoading ? (
            <div className="flex items-center text-gray-500 mt-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Cargando ubicaciones...</span>
            </div>
          ) : (
            displayLocations.map((location) => (
              <div
                key={location.name}
                className="flex items-center cursor-pointer"
                onClick={() => handleLocationToggle(location.name)}
              >
                <div
                  className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${selectedLocations.includes(location.name) ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
                >
                  {selectedLocations.includes(location.name) && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span className="ml-3 text-[#333333]">{location.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({location.count})
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Verification Status Section */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#333333] mb-4">
          Estado de verificación
        </h3>

        <div className="space-y-3">
          {/* Verified campaigns */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleVerificationStatusChange("verified")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${verificationStatus.includes("verified") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {verificationStatus.includes("verified") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Verificadas</span>
            {verificationStatus.includes("verified") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>

          {/* In process campaigns */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleVerificationStatusChange("in_process")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${verificationStatus.includes("in_process") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {verificationStatus.includes("in_process") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">
              En proceso de verificación
            </span>
            {verificationStatus.includes("in_process") && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>

          {/* Unverified campaigns */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleVerificationStatusChange("unverified")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${verificationStatus.includes("unverified") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {verificationStatus.includes("unverified") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Sin verificación</span>
            {verificationStatus.includes("unverified") && (
              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Creation Date Section */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#333333] mb-4">
          Fecha de creación
        </h3>

        <div className="space-y-3">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleCreationDateChange("24h")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${creationDateFilter.includes("24h") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {creationDateFilter.includes("24h") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Últimas 24 horas</span>
            {creationDateFilter.includes("24h") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleCreationDateChange("7d")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${creationDateFilter.includes("7d") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {creationDateFilter.includes("7d") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Últimos 7 días</span>
            {creationDateFilter.includes("7d") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleCreationDateChange("30d")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${creationDateFilter.includes("30d") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {creationDateFilter.includes("30d") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Último mes</span>
            {creationDateFilter.includes("30d") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Amount Raised Section */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#333333] mb-4">
          Monto recaudado
        </h3>

        <div className="space-y-3">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleAmountRaisedChange("less_25")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${amountRaisedFilter.includes("less_25") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {amountRaisedFilter.includes("less_25") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">
              Menos del 25% de la meta
            </span>
            {amountRaisedFilter.includes("less_25") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleAmountRaisedChange("between_25_75")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${amountRaisedFilter.includes("between_25_75") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {amountRaisedFilter.includes("between_25_75") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">
              Entre el 25% y 75% de la meta
            </span>
            {amountRaisedFilter.includes("between_25_75") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleAmountRaisedChange("more_75")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${amountRaisedFilter.includes("more_75") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {amountRaisedFilter.includes("more_75") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Más del 75% de la meta</span>
            {amountRaisedFilter.includes("more_75") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleAmountRaisedChange("goal_reached")}
          >
            <div
              className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${amountRaisedFilter.includes("goal_reached") ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
            >
              {amountRaisedFilter.includes("goal_reached") && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            <span className="ml-3 text-[#333333]">Meta alcanzada</span>
            {amountRaisedFilter.includes("goal_reached") && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
