"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Donation } from "@/hooks/use-user-donations";
import { Badge } from "@/components/ui/badge";

interface DonationsHistoryTableProps {
  donations: Donation[];
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function DonationsHistoryTable({
  donations,
  currentPage,
  totalPages,
  basePath = "/dashboard/donations",
}: DonationsHistoryTableProps) {
  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Payment status display
  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Completada
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-600 border-yellow-200 flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1"
          >
            <XCircle className="h-3 w-3" />
            Fallida
          </Badge>
        );
      case "refunded":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reembolsada
          </Badge>
        );
      default:
        return status;
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-2 font-medium text-gray-600">
                Campañas apoyadas
              </th>
              <th className="text-center py-4 px-2 font-medium text-gray-600">
                Fecha
              </th>
              <th className="text-center py-4 px-2 font-medium text-gray-600">
                Estado
              </th>
              <th className="text-right py-4 px-2 font-medium text-gray-600">
                Monto
              </th>
              <th className="text-center py-4 px-2 font-medium text-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr
                key={donation.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-4 px-2">
                  <Link
                    href={`/campaign/${donation.campaign?.id}`}
                    className="flex items-center gap-3 text-gray-800 hover:text-[#2c6e49]"
                  >
                    {donation.campaign?.media &&
                      donation.campaign.media.length > 0 && (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden">
                          <Image
                            src={
                              donation.campaign.media[0].previewUrl ||
                              donation.campaign.media[0].mediaUrl
                            }
                            alt={donation.campaign.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    <div>
                      <div className="font-medium">
                        {donation.campaign?.title}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {donation.campaign?.category?.replace(/_/g, " ")}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-2 text-center text-gray-700">
                  {formatDate(donation.created_at)}
                </td>
                <td className="py-4 px-2 text-center">
                  {getPaymentStatusDisplay(donation.payment_status)}
                </td>
                <td className="py-4 px-2 text-right font-medium">
                  {donation.currency} {donation.amount.toFixed(2)}
                </td>
                <td className="py-4 px-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#2c6e49] hover:text-[#1e4d33] hover:bg-green-50"
                    asChild
                  >
                    <Link href={`/dashboard/donations/${donation.id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Ver detalles
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center mt-6 gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={currentPage <= 1}
            className="rounded-full bg-gray-100 hover:bg-gray-200"
            asChild
          >
            <Link
              href={{
                pathname: basePath,
                query: { page: currentPage > 1 ? currentPage - 1 : 1 },
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;

            // Logic to show pages around the current page when there are many pages
            if (totalPages > 5) {
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
            }

            return (
              <Button
                key={pageNum}
                variant="ghost"
                size="icon"
                className={`rounded-full bg-gray-100 ${
                  currentPage === pageNum
                    ? "border-[#2c6e49] border text-[#2c6e49]"
                    : "hover:bg-gray-200"
                }`}
                asChild
              >
                <Link
                  href={{
                    pathname: basePath,
                    query: { page: pageNum },
                  }}
                >
                  {pageNum}
                </Link>
              </Button>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="px-2">...</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100 hover:bg-gray-200"
                asChild
              >
                <Link
                  href={{
                    pathname: basePath,
                    query: { page: totalPages },
                  }}
                >
                  {totalPages}
                </Link>
              </Button>
            </>
          )}

          <Button
            variant="default"
            size="icon"
            disabled={currentPage >= totalPages}
            className="rounded-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
            asChild
          >
            <Link
              href={{
                pathname: basePath,
                query: {
                  page: currentPage < totalPages ? currentPage + 1 : totalPages,
                },
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
