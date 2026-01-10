"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserDashboardContent } from "@/components/dashboard/user-dashboard-content";
import { AdminDashboardContent } from "@/components/dashboard/admin-dashboard-content";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { X } from "lucide-react";
import { ProfileData } from "@/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth, Profile } from "@/providers/auth-provider";
import { useDb } from "@/hooks/use-db";
import { PasswordResetHandler } from "@/components/auth/reset-password/password-reset-handler";
import { ResetPasswordDialog } from "@/components/auth/reset-password/reset-password-dialog";

// Ensure ProfileData and Profile have compatible shapes for our purposes
type DashboardProfile = ProfileData;

export default function DashboardPage() {
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  
  const handleSuccess = () => {
     setIsResetPasswordOpen(false);
     toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
     });
  };

  const router = useRouter();
  
  // Get auth context
  const { user, profile: authProfile, isLoading: authLoading } = useAuth();
  const { getProfile, updateProfile } = useDb();

  // Helper to convert any profile object to our consistent DashboardProfile format
  const formatProfileData = useCallback(
    (data: Profile | ProfileData | any): DashboardProfile => {
      if (!data) {
        throw new Error("No profile data provided");
      }

      // Function to safely get ISO string
      const getISOString = (dateVal: any): string => {
        if (typeof dateVal === "string") return dateVal;
        if (dateVal instanceof Date) return dateVal.toISOString();
        return new Date().toISOString();
      };

      const result: DashboardProfile = {
        id: data.id || "",
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || null,
        role: data.role || "user",
        created_at:
          data.created_at || data.createdAt || getISOString(new Date()),
        profile_picture: data.profile_picture || data.profilePicture || null,
        identity_number: data.identity_number || data.identityNumber,
        birth_date: data.birth_date || data.birthDate,
        // Include any other fields that might be expected
        ...data,
      };

      return result;
    },
    []
  );

  // Optimized profile loading that prioritizes auth context
  const loadProfile = useCallback(async () => {
    // Don't start loading if auth is still loading
    if (authLoading) {
      return;
    }

    // Redirect if no user
    if (!user) {
      router.push("/sign-in");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let profileData: Profile | ProfileData | null = null;

      // First, try to use the profile from auth context if it's complete
      if (authProfile && authProfile.id && authProfile.email) {
        console.log("Using profile from auth context:", authProfile);
        profileData = authProfile;
      } else {
        // Fallback: fetch fresh profile data from API
        console.log("Fetching fresh profile data from API for user:", user.id);
        profileData = await getProfile(user.id);

        if (!profileData) {
          throw new Error("No se pudo cargar la información del perfil");
        }
      }

      // Format and set the profile data
      const formattedProfile = formatProfileData(profileData);
      setProfile(formattedProfile);
      setIsAdmin(formattedProfile.role === "admin");

      // Initialize form data
      setProfileForm({
        name: formattedProfile.name || "",
        email: formattedProfile.email || "",
        phone: formattedProfile.phone || "",
        address: formattedProfile.address || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al cargar el perfil";
      setError(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, authProfile, authLoading, router, getProfile, formatProfileData]);

  // Load profile when dependencies change
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Function to refresh profile data after updates
  const refreshProfileData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Always fetch fresh data from the API after updates
      const freshProfileData = await getProfile(user.id);

      if (freshProfileData) {
        const formattedProfile = formatProfileData(freshProfileData);
        setProfile(formattedProfile);
        setIsAdmin(formattedProfile.role === "admin");

        // Update form data with fresh profile data
        setProfileForm({
          name: formattedProfile.name || "",
          email: formattedProfile.email || "",
          phone: formattedProfile.phone || "",
          address: formattedProfile.address || "",
        });
      }
    } catch (error) {
      console.error("Error refreshing profile data:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar el perfil";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, getProfile, formatProfileData]);

  const handleSaveChanges = async () => {
    try {
      if (!profile) return;

      const { error } = await updateProfile(profile.id, {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
      });

      if (error) throw error;

      // Refresh profile data after update
      await refreshProfileData();

      setIsEditModalOpen(false);

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Show loading spinner while auth or profile is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-[#2c6e49] font-medium text-lg">
          {authLoading
            ? "Verificando autenticación..."
            : "Cargando información del perfil..."}
        </p>
      </div>
    );
  }

  // Show error state if there's an error and no profile
  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">
            Error al cargar el dashboard
          </p>
          <p className="text-gray-600">{error}</p>
          <Button
            onClick={loadProfile}
            className="bg-[#2c6e49] hover:bg-[#2c6e49]/90"
          >
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  // Show dashboard content
  return (
    <>
      {isAdmin ? (
        <AdminDashboardContent profile={profile} />
      ) : (
        <UserDashboardContent
          profile={profile}
          onEditProfile={() => setIsEditModalOpen(true)}
          onChangePassword={() => setIsResetPasswordOpen(true)}
          onProfileUpdated={refreshProfileData}
        />
      )}

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#F9F9F3] p-0 border-0 max-w-lg mx-auto [&>button]:hidden">
          {/* Header with beige background */}
          <div className="flex justify-between items-center p-6 border-b bg-[#f0ead6]">
            <DialogTitle className="text-[#2c6e49] text-xl font-semibold">
              Editar Información personal
            </DialogTitle>
            {/* Perfect sized X icon */}
            <div className="w-12 h-12 flex items-center justify-center">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#2c6e49] bg-transparent border-none cursor-pointer p-0"
              >
                <X className="h-6 w-6" strokeWidth={2} />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium"
              >
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                readOnly
                disabled
                className="w-full border border-black bg-transparent opacity-70 cursor-not-allowed"
              />
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-gray-700 font-medium">
                Nombre completo
              </label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                placeholder="Ingresa tu nombre completo"
                className="w-full border border-black bg-transparent"
              />
            </div>

            {/* Phone Field - with consistent styling */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-gray-700 font-medium"
              >
                Teléfono
              </label>
              <div className="flex w-full border border-black rounded-md overflow-hidden">
                <div className="flex items-center px-3 py-2 bg-transparent border-r border-black">
                  <span className="mr-2">🇧🇴</span>
                  <span>+591</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  placeholder="33445567"
                  className="flex-1 h-11 px-3 py-2 bg-transparent border-0 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label
                htmlFor="address"
                className="block text-gray-700 font-medium"
              >
                Dirección
              </label>
              <Input
                id="address"
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, address: e.target.value })
                }
                placeholder="Ingresa tu dirección"
                className="w-full border border-black bg-transparent"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveChanges}
              className="w-full mt-6 bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full py-4"
            >
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Change Password / Reset Password Dialog */}
      <ResetPasswordDialog 
        open={isResetPasswordOpen} 
        onOpenChange={setIsResetPasswordOpen}
        onSuccess={handleSuccess}
      />

      <PasswordResetHandler />
    </>
  );
}
