"use client";

import { AdminDonationData } from "@/app/(dashboard)/dashboard/donations/page"; // Import the interface
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale"; // Optional: for Spanish date formatting

interface AdminDonationTableProps {
  donations: AdminDonationData[];
}

// Helper to format currency (modify as needed for your currency)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-BO", {
    // Example: Bolivian Boliviano
    style: "currency",
    currency: "BOB",
  }).format(amount);
};

export function AdminDonationTable({ donations }: AdminDonationTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "succeeded":
      case "successful": // Add variations if needed
        return "success";
      case "pending":
        return "secondary";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead>Donor</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {donations.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              No donations found.
            </TableCell>
          </TableRow>
        ) : (
          donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell className="font-medium">
                {donation.campaigns?.[0]?.title || "N/A"}
              </TableCell>
              <TableCell>
                {donation.profiles?.[0]?.name || "Anonymous"} (
                {donation.profiles?.[0]?.email || "-"})
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(donation.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(donation.payment_status)}>
                  {donation.payment_status || "Unknown"}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(donation.created_at), "PPPpp", { locale: es })}{" "}
                {/* Example format with time */}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
