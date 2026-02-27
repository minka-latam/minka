"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Filter } from "lucide-react";
import { CampaignFilters } from "@/hooks/use-campaign-browse";
import { LocationItem } from "./FilterSidebar";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationItem[];
  filters: CampaignFilters;
  onUpdateFilters: (newFilters: Partial<CampaignFilters>) => void;
  onResetFilters: () => void;
  isLocationsLoading?: boolean;
}

export function MobileFilterModal({
  isOpen,
  onClose,
  locations,
  filters,
  onUpdateFilters,
  onResetFilters,
  isLocationsLoading = false,
}: MobileFilterModalProps) {
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

  // Filter states
  const [verificationStatus, setVerificationStatus] = useState<string[]>([]);
  const [creationDateFilter, setCreationDateFilter] = useState<string[]>([]);
  const [amountRaisedFilter, setAmountRaisedFilter] = useState<string[]>([]);

  // Initialize states from filters
  useEffect(() => {
    if (filters.search) {
      setSearchQuery(filters.search);
    } else {
      setSearchQuery("");
    }

    // Initialize verification status
    if (filters.verificationStatus) {
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
      if (uiStatus) {
        setVerificationStatus([uiStatus]);
      }
    } else if (filters.verified === true) {
      setVerificationStatus(["verified"]);
    } else {
      setVerificationStatus([]);
    }

    // Initialize creation date filter
    if (filters.createdAfter) {
      const createdAfter = new Date(filters.createdAfter);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAfter.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        setCreationDateFilter(["last_week"]);
      } else if (diffDays <= 30) {
        setCreationDateFilter(["last_month"]);
      } else if (diffDays <= 90) {
        setCreationDateFilter(["last_3_months"]);
      } else {
        setCreationDateFilter([]);
      }
    } else {
      setCreationDateFilter([]);
    }

    // Initialize amount raised filter
    if (
      filters.fundingPercentageMin !== undefined ||
      filters.fundingPercentageMax !== undefined
    ) {
      const min = filters.fundingPercentageMin || 0;
      const max = filters.fundingPercentageMax || 100;

      if (min === 0 && max === 25) {
        setAmountRaisedFilter(["less_25"]);
      } else if (min === 25 && max === 75) {
        setAmountRaisedFilter(["between_25_75"]);
      } else if (min === 75 && max === 100) {
        setAmountRaisedFilter(["more_75"]);
      } else if (min === 100) {
        setAmountRaisedFilter(["goal_reached"]);
      } else {
        setAmountRaisedFilter([]);
      }
    } else {
      setAmountRaisedFilter([]);
    }
  }, [filters]);

  // Debounced search function
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    if (!isInitializingRef.current) {
      debouncedSearch(newValue);
    }
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery("");
    debouncedSearch("");
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    const trimmedQuery = searchQuery.trim();
    onUpdateFilters({ search: trimmedQuery || undefined });
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

  // Handle verification status change
  const handleVerificationStatusChange = (status: string) => {
    const newStatus = [...verificationStatus];

    if (newStatus.includes(status)) {
      const index = newStatus.indexOf(status);
      newStatus.splice(index, 1);
    } else {
      newStatus.push(status);
    }

    setVerificationStatus(newStatus);

    if (newStatus.length === 1) {
      let selectedStatus: "verified" | "pending" | "unverified";

      if (newStatus[0] === "verified") {
        selectedStatus = "verified";
      } else if (newStatus[0] === "in_process") {
        selectedStatus = "pending";
      } else if (newStatus[0] === "unverified") {
        selectedStatus = "unverified";
      } else {
        selectedStatus = "verified";
      }

      onUpdateFilters({
        verificationStatus: selectedStatus,
        verified: undefined,
      });
    } else if (newStatus.length === 0) {
      onUpdateFilters({
        verificationStatus: undefined,
        verified: undefined,
      });
    } else {
      onUpdateFilters({
        verificationStatus: undefined,
        verified: undefined,
      });
    }
  };

  // Handle creation date change
  const handleCreationDateChange = (filter: string) => {
    const newFilters = [...creationDateFilter];

    if (newFilters.includes(filter)) {
      const index = newFilters.indexOf(filter);
      newFilters.splice(index, 1);
    } else {
      newFilters.push(filter);
    }

    setCreationDateFilter(newFilters);

    let createdAfter: string | undefined = undefined;

    if (newFilters.includes("last_week")) {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      createdAfter = date.toISOString();
    } else if (newFilters.includes("last_month")) {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      createdAfter = date.toISOString();
    } else if (newFilters.includes("last_3_months")) {
      const date = new Date();
      date.setMonth(date.getMonth() - 3);
      createdAfter = date.toISOString();
    }

    onUpdateFilters({ createdAfter });
  };

  // Handle amount raised change
  const handleAmountRaisedChange = (filter: string) => {
    const newFilters = [...amountRaisedFilter];

    if (newFilters.includes(filter)) {
      const index = newFilters.indexOf(filter);
      newFilters.splice(index, 1);
    } else {
      newFilters.push(filter);
    }

    setAmountRaisedFilter(newFilters);

    let fundingPercentageMin: number | undefined = undefined;
    let fundingPercentageMax: number | undefined = undefined;

    if (newFilters.includes("less_25")) {
      fundingPercentageMin = 0;
      fundingPercentageMax = 25;
    } else if (newFilters.includes("between_25_75")) {
      fundingPercentageMin = 25;
      fundingPercentageMax = 75;
    } else if (newFilters.includes("more_75")) {
      fundingPercentageMin = 75;
      fundingPercentageMax = 100;
    } else if (newFilters.includes("goal_reached")) {
      fundingPercentageMin = 100;
    }

    onUpdateFilters({
      fundingPercentageMin,
      fundingPercentageMax,
    });
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    onClose();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    onResetFilters();
    setSearchQuery("");
    setVerificationStatus([]);
    setCreationDateFilter([]);
    setAmountRaisedFilter([]);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#333333]">Filtros</h2>
          <button onClick={onClose} className="p-2">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Bar */}
          <div>
            <h3 className="text-lg font-semibold text-[#333333] mb-3">
              Buscar
            </h3>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar campañas"
                  className="w-full h-12 px-4 pl-10 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a5535] focus:border-transparent"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <div className="absolute left-3 top-3.5">
                  <Search size={18} className="text-gray-400" />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-[#333333] mb-3">
              Ubicación
            </h3>
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
                <span className="ml-3 text-[#333333]">
                  Todas las ubicaciones
                </span>
              </div>

              {isLocationsLoading ? (
                <div className="flex items-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1a5535] rounded-full animate-spin mr-3"></div>
                  Cargando ubicaciones...
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
                    <span className="ml-3 text-[#333333] flex-1">
                      {location.name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({location.count})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="text-lg font-semibold text-[#333333] mb-3">
              Estado de verificación
            </h3>
            <div className="space-y-3">
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
                <span className="ml-3 text-[#333333]">En proceso</span>
                {verificationStatus.includes("in_process") && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>

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
                <span className="ml-3 text-[#333333]">No verificadas</span>
                {verificationStatus.includes("unverified") && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Creation Date */}
          <div>
            <h3 className="text-lg font-semibold text-[#333333] mb-3">
              Fecha de creación
            </h3>
            <div className="space-y-3">
              {[
                { id: "last_week", label: "Última semana" },
                { id: "last_month", label: "Último mes" },
                { id: "last_3_months", label: "Últimos 3 meses" },
              ].map((dateOption) => (
                <div
                  key={dateOption.id}
                  className="flex items-center cursor-pointer"
                  onClick={() => handleCreationDateChange(dateOption.id)}
                >
                  <div
                    className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${creationDateFilter.includes(dateOption.id) ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
                  >
                    {creationDateFilter.includes(dateOption.id) && (
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
                    {dateOption.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Raised */}
          <div>
            <h3 className="text-lg font-semibold text-[#333333] mb-3">
              Monto recaudado
            </h3>
            <div className="space-y-3">
              {[
                { id: "less_25", label: "Menos del 25%" },
                { id: "between_25_75", label: "Entre 25% y 75%" },
                { id: "more_75", label: "Más del 75%" },
                { id: "goal_reached", label: "Meta alcanzada" },
              ].map((amountOption) => (
                <div
                  key={amountOption.id}
                  className="flex items-center cursor-pointer"
                  onClick={() => handleAmountRaisedChange(amountOption.id)}
                >
                  <div
                    className={`w-6 h-6 border border-gray-400 rounded flex items-center justify-center ${amountRaisedFilter.includes(amountOption.id) ? "bg-[#1a5535] border-[#1a5535]" : "bg-white"}`}
                  >
                    {amountRaisedFilter.includes(amountOption.id) && (
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
                    {amountOption.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="flex-1 text-[#2c6e49] border-[#2c6e49] hover:bg-[#2c6e49] hover:text-white"
            >
              Limpiar
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-[#2c6e49] hover:bg-[#2c6e49]/90 text-white"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
