"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InlineSpinner } from "@/components/ui/inline-spinner";
import { LegalEntity, LegalEntityFormData } from "@/hooks/use-legal-entities";
import {
  getProvincesForDepartment,
  DEPARTMENT_LABELS,
} from "@/constants/bolivia-provinces";

// Validation schema
const legalEntitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  legalForm: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  department: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  socialLinks: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type FormValues = z.infer<typeof legalEntitySchema>;

interface LegalEntityFormProps {
  initialData?: LegalEntity;
  onSubmit: (data: LegalEntityFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LegalEntityForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: LegalEntityFormProps) {
  const [availableProvinces, setAvailableProvinces] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(legalEntitySchema),
    defaultValues: {
      name: initialData?.name || "",
      taxId: initialData?.taxId || "",
      registrationNumber: initialData?.registrationNumber || "",
      legalForm: initialData?.legalForm || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      province: initialData?.province || "",
      department: initialData?.department || "",
      contactName: initialData?.contactName || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      website: initialData?.website || "",
      socialLinks: initialData?.socialLinks || "",
      description: initialData?.description || "",
      status: initialData?.status || "active",
    },
  });

  const watchedDepartment = form.watch("department");

  // Update available provinces when department changes
  useEffect(() => {
    if (watchedDepartment) {
      const provinces = getProvincesForDepartment(watchedDepartment);
      setAvailableProvinces([...provinces]);

      // Clear province if it's not valid for the new department
      const currentProvince = form.getValues("province");
      if (
        currentProvince &&
        !provinces.some((p) => p.value === currentProvince)
      ) {
        form.setValue("province", "");
      }
    } else {
      setAvailableProvinces([]);
      form.setValue("province", "");
    }
  }, [watchedDepartment, form]);

  // Set initial provinces if editing
  useEffect(() => {
    if (initialData?.department) {
      const provinces = getProvincesForDepartment(initialData.department);
      setAvailableProvinces([...provinces]);
    }
  }, [initialData]);

  const handleSubmit = async (data: FormValues) => {
    try {
      await onSubmit(data as LegalEntityFormData);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Legal forms options for Bolivia
  const legalForms = [
    { value: "sa", label: "Sociedad Anónima (S.A.)" },
    { value: "srl", label: "Sociedad de Responsabilidad Limitada (S.R.L.)" },
    { value: "fundacion", label: "Fundación" },
    { value: "asociacion", label: "Asociación" },
    { value: "cooperativa", label: "Cooperativa" },
    { value: "ong", label: "Organización No Gubernamental (ONG)" },
    { value: "empresa_unipersonal", label: "Empresa Unipersonal" },
    { value: "sucursal", label: "Sucursal" },
    { value: "otro", label: "Otro" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Información Básica</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Organización *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Fundación Amboró" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Registro</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de registro oficial"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="legalForm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma Legal</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la forma legal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {legalForms.map((form) => (
                      <SelectItem key={form.value} value={form.value}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción de la organización y sus actividades"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Información de Contacto</h3>

          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la persona</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: María López" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contacto@organizacion.com"
                      {...field}
                    />
                  </FormControl>
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
                    <Input placeholder="Ej: +591 12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio Web</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.organizacion.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialLinks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Redes Sociales</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Instagram, Facebook, LinkedIn o enlaces relevantes"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Ubicación</h3>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección completa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provincia</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={
                      !watchedDepartment || availableProvinces.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProvinces.map((province) => (
                        <SelectItem key={province.value} value={province.value}>
                          {province.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Santa Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Estado</h3>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <p className="text-sm text-gray-600">
                  Las organizaciones activas aparecen en el formulario de campañas.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-[#2c6e49] hover:bg-[#1e4d33]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <InlineSpinner className="mr-2" />
                {initialData ? "Actualizando..." : "Creando..."}
              </>
            ) : (
              <>{initialData ? "Actualizar" : "Crear"} Organización</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
