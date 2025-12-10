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
  address: z
    .string()
    .max(200, "La dirección no puede exceder 200 caracteres")
    .optional()
    .nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>; 