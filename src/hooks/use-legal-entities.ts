import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface LegalEntity {
  id: string;
  name: string;
  taxId?: string;
  registrationNumber?: string;
  legalForm?: string;
  address?: string;
  city?: string;
  province?: string;
  department?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  documentUrls: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
  };
}

export interface LegalEntityFormData {
  name: string;
  taxId?: string;
  registrationNumber?: string;
  legalForm?: string;
  address?: string;
  city?: string;
  province?: string;
  department?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  documentUrls?: string[];
  status?: "active" | "inactive";
}

export interface LegalEntitiesResponse {
  legalEntities: LegalEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LegalEntityFilters {
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}

export function useLegalEntities() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch legal entities with filters
  const fetchLegalEntities = async (
    filters: LegalEntityFilters = {}
  ): Promise<LegalEntitiesResponse | null> => {
    try {
      setLoading(true);

      const searchParams = new URLSearchParams();

      if (filters.search) searchParams.set("search", filters.search);
      if (filters.status) searchParams.set("status", filters.status);
      if (filters.page) searchParams.set("page", filters.page.toString());
      if (filters.limit) searchParams.set("limit", filters.limit.toString());

      const response = await fetch(
        `/api/admin/legal-entities?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch legal entities");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching legal entities:", error);
      toast({
        title: "Error",
        description: "Failed to fetch legal entities",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create legal entity
  const createLegalEntity = async (
    data: LegalEntityFormData
  ): Promise<boolean> => {
    try {
      setCreating(true);

      const response = await fetch("/api/admin/legal-entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create legal entity");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Legal entity created successfully",
      });

      return true;
    } catch (error) {
      console.error("Error creating legal entity:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create legal entity",
        variant: "destructive",
      });
      return false;
    } finally {
      setCreating(false);
    }
  };

  // Update legal entity
  const updateLegalEntity = async (
    id: string,
    data: Partial<LegalEntityFormData>
  ): Promise<boolean> => {
    try {
      setUpdating(true);

      const response = await fetch("/api/admin/legal-entities", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update legal entity");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Legal entity updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating legal entity:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update legal entity",
        variant: "destructive",
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  // Delete legal entity
  const deleteLegalEntity = async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);

      const response = await fetch(`/api/admin/legal-entities?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete legal entity");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message || "Legal entity deleted successfully",
      });

      return true;
    } catch (error) {
      console.error("Error deleting legal entity:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete legal entity",
        variant: "destructive",
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  // Fetch active legal entities for campaign form
  const fetchActiveLegalEntities = async (
    search?: string
  ): Promise<LegalEntity[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (search) searchParams.set("search", search);
      searchParams.set("limit", "50"); // Get more entities for selection

      const response = await fetch(
        `/api/legal-entities?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch legal entities");
      }

      const data = await response.json();
      return data.legalEntities || [];
    } catch (error) {
      console.error("Error fetching active legal entities:", error);
      return [];
    }
  };

  return {
    loading,
    creating,
    updating,
    deleting,
    fetchLegalEntities,
    fetchActiveLegalEntities,
    createLegalEntity,
    updateLegalEntity,
    deleteLegalEntity,
  };
}
