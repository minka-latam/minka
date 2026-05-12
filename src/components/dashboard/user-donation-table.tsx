"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PaymentStatus } from "@prisma/client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Define a simplified donation interface for user donations
export interface UserDonationData {
  id: string;
  amount: number;
  payment_status: PaymentStatus | string;
  created_at: string;
  campaign: {
    id: string;
    title: string;
  };
}

interface UserDonationTableProps {
  donations: UserDonationData[];
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(amount);
};

export function UserDonationTable({ donations }: UserDonationTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Calculate pagination
  const totalPages = Math.ceil(donations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = donations.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at boundaries
      if (currentPage <= 2) {
        endPage = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push("...");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200">
            <TableHead className="font-medium text-gray-700">
              Campañas apoyadas
            </TableHead>
            <TableHead className="font-medium text-gray-700">Fecha</TableHead>
            <TableHead className="font-medium text-gray-700 text-right">
              Monto
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground py-8"
              >
                Aún no has realizado ninguna donación.
              </TableCell>
            </TableRow>
          ) : (
            currentItems.map((donation) => (
              <TableRow key={donation.id} className="border-b border-gray-100">
                <TableCell className="py-4 font-medium text-gray-700">
                  <Link
                    href={`/campaign/${donation.campaign?.id}`}
                    className="text-green-600 hover:underline"
                  >
                    {donation.campaign?.title || "N/A"}
                  </Link>
                </TableCell>
                <TableCell className="py-4 text-gray-600">
                  {format(new Date(donation.created_at), "d/MM/yyyy", {
                    locale: es,
                  })}
                </TableCell>
                <TableCell className="py-4 text-right text-gray-700">
                  {`Bs. ${donation.amount.toFixed(2)}`.replace(".", ",")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 disabled:opacity-50"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>

          {generatePageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && setCurrentPage(page)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                currentPage === page
                  ? "bg-green-600 text-white"
                  : page === "..."
                    ? "text-gray-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              disabled={page === "..."}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
