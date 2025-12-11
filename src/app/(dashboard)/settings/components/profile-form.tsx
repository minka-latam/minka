"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Calendar, IdCard } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { profileFormSchema } from "@/lib/validations/profile";
import type { ProfileFormValues } from "@/lib/validations/profile";
import { Separator } from "@/components/ui/separator";

export function ProfileForm() {
  const { profile, user } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] =
    useState<ProfileFormValues | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: typeof profile?.name === "string" ? profile.name : "",
      phone: typeof profile?.phone === "string" ? profile.phone : "",
      bio: typeof profile?.bio === "string" ? profile.bio : "",
      location: typeof profile?.location === "string" ? profile.location : "",
      address: typeof profile?.address === "string" ? profile.address : "",
    },
  });

  async function handleSubmit(data: ProfileFormValues) {
    setPendingChanges(data);
    setShowConfirmDialog(true);
  }

  async function handleConfirmUpdate() {
    if (!pendingChanges || !profile?.id) return;

    try {
      setIsUpdating(true);

      const response = await fetch(`/api/profile/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pendingChanges,
          profilePicture: newAvatarUrl || profile.profile_picture,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente.",
      });

      form.reset(pendingChanges);
    } catch {
      toast({
        title: "Error",
        description: "Error al actualizar el perfil. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setShowConfirmDialog(false);
      setPendingChanges(null);
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No especificada";
    try {
      return new Date(dateString).toLocaleDateString("es-BO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "No especificada";
    }
  };

  // Format join date
  const joinDate = profile?.created_at
    ? formatDate(profile.created_at)
    : "No disponible";

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Avatar Upload */}
          {profile && (
            <AvatarUpload
              userId={String(profile.id)}
              currentAvatarUrl={
                typeof profile.profile_picture === "string"
                  ? profile.profile_picture
                  : null
              }
              onUploadComplete={(url) => setNewAvatarUrl(url)}
              onUploadError={(error) => {
                toast({
                  title: "Error",
                  description: error.message,
                  variant: "destructive",
                });
              }}
            />
          )}

          {/* Read-only Information */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Información de cuenta
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Miembro desde:</span>
                <span className="font-medium">{joinDate}</span>
              </div>
              {profile?.identity_number && (
                <div className="flex items-center gap-2 text-sm">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Documento:</span>
                  <span className="font-medium">
                    ****{profile.identity_number.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu nombre completo"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Este es el nombre que se mostrará públicamente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+591 70000000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Tu número de teléfono de contacto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografía</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos un poco sobre ti..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Una breve descripción sobre ti (máximo 500 caracteres).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: La Paz, Bolivia"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu dirección"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isUpdating}
            >
              Restablecer
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmUpdate}
        title="Actualizar perfil"
        description="¿Estás seguro de que deseas actualizar tu perfil? Esta acción guardará los cambios realizados."
      />
    </>
  );
}
