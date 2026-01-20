"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCampaign, CampaignDonation } from "@/hooks/use-campaign";

interface DonationsTabProps {
  campaign: Record<string, any>;
}

// Define possible API response formats
interface ApiResponseWithData {
  data: CampaignDonation[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ApiResponseWithDonations {
  donations: CampaignDonation[];
  total: number;
  totalAmount: number;
  hasMore: boolean;
  isOwner: boolean;
}

// Type guard to check response format
function isResponseWithData(response: any): response is ApiResponseWithData {
  return (
    response &&
    Array.isArray(response.data) &&
    typeof response.meta === "object"
  );
}

export function DonationsTab({ campaign }: DonationsTabProps) {
  const [donations, setDonations] = useState<CampaignDonation[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const { getCampaignDonations } = useCampaign();

  // Debug function to log current state
  const logState = () => {
    console.log({
      campaignId: campaign?.id,
      donations,
      donationsLength: donations?.length || 0,
      isLoading,
      error,
      totalDonations,
      currentPage,
      totalPages,
    });
  };

  // Load donations when component mounts or campaign.id changes
  useEffect(() => {
    console.log("DonationsTab mounted or campaign changed:", campaign?.id);
    if (campaign?.id) {
      fetchDonations(1);
    } else {
      console.error("Campaign ID is missing", campaign);
      setError("No se pudo cargar las donaciones: ID de campaña faltante");
      setIsLoading(false);
    }
  }, [campaign?.id]);

  const fetchDonations = async (pageNumber: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `⏳ Fetching donations for campaign ID: ${campaign.id}, page: ${pageNumber}`
      );

      const response = await getCampaignDonations(
        campaign.id,
        limit,
        (pageNumber - 1) * limit
      );

      console.log("📊 Raw API response:", response);

      if (response) {
        let donationsList: CampaignDonation[] = [];

        // Check which response format we got and extract data accordingly
        if (isResponseWithData(response)) {
          // New API format with data and meta properties
          donationsList = response.data;

          console.log("✅ Donations extracted from data property:", {
            count: donationsList.length,
            samples: donationsList.slice(0, 2),
          });

          setDonations(donationsList);
          setTotalDonations(response.meta.totalCount);
          setCurrentPage(response.meta.currentPage);
          setTotalPages(response.meta.totalPages);
        } else {
          // Old API format with donations property
          donationsList = Array.isArray(response.donations)
            ? response.donations
            : [];

          console.log("✅ Donations extracted from donations property:", {
            count: donationsList.length,
            samples: donationsList.slice(0, 2),
          });

          setDonations(donationsList);
          setTotalDonations(response.total || 0);
          setCurrentPage(pageNumber);
          setTotalPages(Math.ceil((response.total || 0) / limit));
        }

        // Debug log after state should be updated
        setTimeout(() => {
          console.log("⚙️ Component state after update:", {
            donationsLength: donationsList.length,
            donations: donationsList,
          });
        }, 0);
      } else {
        console.error("❌ No donation data returned");
        setError("No se pudieron cargar las donaciones");
      }
    } catch (err) {
      console.error("❌ Error fetching donations:", err);
      setError("Error al cargar las donaciones");
    } finally {
      setIsLoading(false);
      // Log final state after loading is complete
      setTimeout(logState, 0);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchDonations(page);
  };

  const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toLocaleString()}`;
  };

  // This will run whenever the dependencies change and log the current state
  useEffect(() => {
    console.log("Donations state changed:", {
      donationsCount: donations?.length || 0,
      isLoading,
      hasError: Boolean(error),
    });
  }, [donations, isLoading, error]);

  // Determine if we have donations to display - more specific to catch edge cases
  const hasDonations = Array.isArray(donations) && donations.length > 0;

  return (
    <div className="w-full px-6 md:px-8 lg:px-16 xl:px-24 py-6 flex flex-col min-h-[calc(100vh-200px)]">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        Donaciones
      </h2>

      {/* Donations section */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 rounded-lg flex-1 flex flex-col justify-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-600 max-w-md mx-auto">{error}</p>
          </div>
        ) : hasDonations ? (
          <div className="flex-1 flex flex-col">
            {/* Table Header */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Nombre del donador
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Monto donado
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Propina a Minka
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Total pagado
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((donation, index) => (
                  <tr
                    key={donation.id || index}
                    className={`${index % 2 === 1 ? "bg-[#f9faf8]" : ""}`}
                  >
                    <td className="py-4 px-4 text-gray-700">
                      {donation.donor?.name || "Anónimo"}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {formatCurrency(donation.amount || 0)}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {formatCurrency(donation.tip_amount || 0)}
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {formatCurrency(donation.total_amount || donation.amount || 0)}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {new Date(
                        donation.createdAt || new Date()
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg flex-1 flex flex-col justify-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay donaciones aún
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Tu campaña no ha recibido donaciones todavía.
            </p>
          </div>
        )}

        {/* Pagination - Bottom of the page style from image */}
        {hasDonations && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              className="flex items-center px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Anterior</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber = i + 1;

              // Handle case when current page is not in the first 5 pages
              if (totalPages > 5 && currentPage > 3) {
                // Show ellipsis for beginning pages if needed
                if (i === 0 && currentPage > 3) {
                  return (
                    <button
                      key="page-1"
                      onClick={() => goToPage(1)}
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      1
                    </button>
                  );
                }

                if (i === 1 && currentPage > 4) {
                  return (
                    <span key="ellipsis-start" className="px-1 text-gray-500">
                      ...
                    </span>
                  );
                }

                // Adjust pageNumber to center current page
                const offset = Math.min(currentPage - 3, totalPages - 5);
                pageNumber = i + 1 + offset;
              }

              // Don't show anything if page number is out of bounds
              if (pageNumber > totalPages) return null;

              const isActive = pageNumber === currentPage;

              return (
                <button
                  key={`page-${pageNumber}`}
                  onClick={() => goToPage(pageNumber)}
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm ${
                    isActive
                      ? "bg-green-700 text-white border border-green-700"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Ellipsis and last page */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-1 text-gray-500">...</span>
                <button
                  onClick={() => goToPage(totalPages)}
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              className="flex items-center px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
