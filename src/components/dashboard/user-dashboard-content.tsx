"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Camera,
  FileText,
  Bell,
  Bookmark,
  LogOut,
  Edit,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ProfileData } from "@/types";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/components/ui/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { useDb } from "@/hooks/use-db";
import { InlineSpinner } from "@/components/ui/inline-spinner";
import {
  formatDocumentForDisplay,
  parseDocumentId,
  getDocumentTypeName,
} from "@/utils/document-formatter";

interface UserDashboardContentProps {
  profile: ProfileData | null;
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onProfileUpdated?: () => Promise<void>;
}

// Simple image editor component for profile picture
const ProfileImageEditor = ({
  imageUrl,
  onSave,
  onCancel,
  isLoading,
  profileName = "",
}: {
  imageUrl: string;
  onSave: (url: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  profileName?: string;
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar imagen de perfil</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="relative mx-auto w-48 h-48 rounded-full overflow-hidden border-2 border-[#2c6e49] bg-[#2c6e49]">
            <Image src={imageUrl} alt="Preview" fill className="object-cover" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(imageUrl)}
            disabled={isLoading}
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <InlineSpinner className="text-white" />
                <span>Guardando...</span>
              </div>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export function UserDashboardContent({
  profile,
  onEditProfile,
  onChangePassword,
  onProfileUpdated,
}: UserDashboardContentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const router = useRouter();
  const { signOut } = useAuth();
  const { isUploading, uploadFile } = useUpload();
  const { updateProfile } = useDb();
  const [optimisticImage, setOptimisticImage] = useState<string | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug logging to see what's in the profile object
  useEffect(() => {
    if (profile) {
      console.log("Profile object:", profile);
      console.log("Available keys:", Object.keys(profile));
      console.log("identityNumber:", profile.identityNumber);
      console.log("identity_number:", profile.identity_number);
      console.log("birthDate:", profile.birthDate);
      console.log("birth_date:", profile.birth_date);
      console.log("Raw profile from props:", profile);
    }
  }, [profile]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: es });
  };

  const birthDate = formatDate(profile?.birthDate || profile?.birth_date);

  const handleSignOut = async () => {
    try {
      await signOut();

      // Use history API to clean up URL state
      window.history.pushState({}, "", "/");

      // Force redirect to homepage
      router.replace("/");

      // Show toast notification
      toast({
        title: "Éxito",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleSelectImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Basic validation
    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast({
        title: "Archivo muy grande",
        description: "El archivo es demasiado grande. El tamaño máximo es 2MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.includes("image/")) {
      toast({
        title: "Formato inválido",
        description: "Solo se permiten archivos de imagen (JPEG, PNG).",
        variant: "destructive",
      });
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setImageToEdit(previewUrl);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!profile?.id) return;

    try {
      setIsSubmitting(true);
      // Optimistically clear the image immediately
      setOptimisticImage("");

      const { error } = await updateProfile(profile.id, {
        profile_picture: null,
      });

      if (error) {
        // Revert optimization on error
        setOptimisticImage(undefined);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Imagen de perfil eliminada correctamente.",
      });

      if (onProfileUpdated) {
        await onProfileUpdated();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen de perfil.",
        variant: "destructive",
      });
      // Ensure we revert to the prop state if failed
      setOptimisticImage(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (existing code)

  const handleSaveProfileImage = async (editedUrl: string) => {
    if (!profile?.id) return;

    try {
      setIsSubmitting(true);

      // ... (file creation logic remains same)
      let imageFile: File;
      if (editedUrl.startsWith("blob:")) {
        const response = await fetch(editedUrl);
        const blob = await response.blob();
        imageFile = new File([blob], `profile-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
      } else {
        const response = await fetch(editedUrl);
        const blob = await response.blob();
        imageFile = new File([blob], `profile-${Date.now()}.jpg`, {
          type: blob.type,
        });
      }

      const result = await uploadFile(imageFile);

      if (!result.success) {
        throw new Error("Failed to upload profile picture");
      }

      // Optimistically set the new image immediately
      setOptimisticImage(result.url);

      // Reset editing state immediately so modal closes and user sees the new image
      setImageToEdit(null);

      const { error } = await updateProfile(profile.id, {
        profile_picture: result.url,
      });

      if (error) {
        setOptimisticImage(undefined);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Imagen de perfil actualizada correctamente.",
      });

      if (onProfileUpdated) {
        await onProfileUpdated();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving profile picture:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen de perfil.",
        variant: "destructive",
      });
      setImageToEdit(null);
      setOptimisticImage(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (render logic)

  // Determine which image to show
  const displayedImage =
    optimisticImage !== undefined
      ? optimisticImage
      : profile?.profilePicture || profile?.profile_picture;

  return (
    <div className="space-y-10">
      {/* ... (header) */}
      
      {/* Personal Information Card */}
      <div className="bg-white rounded-lg p-8 shadow-sm">
        {/* Profile Picture Section */}
        <div className="flex items-start gap-8 pb-8 border-b border-gray-200">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-[#2c6e49] rounded-full flex items-center justify-center overflow-hidden">
              {displayedImage ? (
                <Image
                  src={displayedImage}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                  key={displayedImage} // key forces re-render if URL changes
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-white">
                  <span className="text-3xl font-semibold">
                    {profile?.name
                      ? profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 mb-2">
              Imagen de perfil (Recomendado: 800×800 px)
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-[#2c6e49] border-[#2c6e49] hover:bg-[#2c6e49] hover:text-white"
                onClick={handleSelectImage}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <InlineSpinner className="text-[#2c6e49]" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <>
                    Seleccionar imagen <Camera size={16} />
                  </>
                )}
              </Button>

              {displayedImage && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  onClick={handleDeleteImage}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <InlineSpinner className="text-red-600" />
                      <span>Eliminando...</span>
                    </div>
                  ) : (
                    <>
                      Eliminar imagen <X size={16} />
                    </>
                  )}
                </Button>
              )}

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="text-sm text-gray-500">
              Formatos permitidos: JPG, PNG, GIF (máx. 2MB)
            </div>
          </div>
        </div>

        {/* Personal Information - 3 columns, 2 rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div>
            <h3 className="text-gray-500 mb-2">Nombre completo</h3>
            <p className="text-gray-800 font-medium">
              {profile?.name || "No disponible"}
            </p>
          </div>
          <div>
            <h3 className="text-gray-500 mb-2">Fecha de nacimiento</h3>
            <p className="text-gray-800 font-medium">
              {birthDate || "No disponible"}
            </p>
          </div>
          <div>
            <h3 className="text-gray-500 mb-2">Cédula de Identidad</h3>
            <p className="text-gray-800 font-medium">
              {formatDocumentForDisplay(
                profile?.identityNumber || profile?.identity_number
              )}
            </p>
          </div>
          <div>
            <h3 className="text-gray-500 mb-2">Correo electrónico</h3>
            <p className="text-gray-800 font-medium">
              {profile?.email || "No disponible"}
            </p>
          </div>
          <div>
            <h3 className="text-gray-500 mb-2">Teléfono</h3>
            <p className="text-gray-800 font-medium">
              {profile?.phone || "No disponible"}
            </p>
          </div>
          <div>
            <h3 className="text-gray-500 mb-2">Dirección</h3>
            <p className="text-gray-800 font-medium">
              {profile?.address || "No disponible"}
            </p>
          </div>
        </div>
      </div>

      {/* Control Section Header - Matched size with Information personal */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-800">¡Toma el control!</h1>
      </div>

      {/* Control Cards Section - Single card with 2 cards per row */}
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Donations Card */}
          <Link href="/dashboard/donations" className="block">
            <div className="h-full border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="mb-6 text-[#2c6e49]">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-800">
                Mis donaciones
              </h3>
            </div>
          </Link>

          {/* Manage Campaigns Card */}
          <Link href="/dashboard/campaigns" className="block">
            <div className="h-full border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="mb-6 text-[#2c6e49]">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-800">
                Administrar campañas
              </h3>
            </div>
          </Link>

          {/* Notifications Card */}
          <Link href="/dashboard/notifications" className="block">
            <div className="h-full border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="mb-6 text-[#2c6e49]">
                <Bell size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-800">
                Notificaciones
              </h3>
            </div>
          </Link>

          {/* Saved Campaigns Card */}
          <Link href="/dashboard/saved" className="block">
            <div className="h-full border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="mb-6 text-[#2c6e49]">
                <Bookmark size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-800">
                Campañas guardadas
              </h3>
            </div>
          </Link>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
        >
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>

      {/* Image Editor Modal */}
      {imageToEdit && (
        <ProfileImageEditor
          imageUrl={imageToEdit}
          onSave={handleSaveProfileImage}
          onCancel={() => setImageToEdit(null)}
          isLoading={isSubmitting}
          profileName={profile?.name}
        />
      )}
    </div>
  );
}
