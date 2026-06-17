import * as z from "zod";

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  phone: z
    .string()
    .min(7, "El teléfono debe tener al menos 7 caracteres")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional()
    .nullable(),
  identityNumber: z
    .string()
    .min(5, "El documento debe tener al menos 5 caracteres")
    .max(30, "El documento no puede exceder 30 caracteres")
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, "La biografía no puede exceder 500 caracteres")
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, "La ubicación no puede exceder 100 caracteres")
    .optional()
    .nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
