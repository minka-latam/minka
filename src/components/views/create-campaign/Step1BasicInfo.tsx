"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, X, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useCampaignForm } from "@/components/providers/campaign-form-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

const formSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: "El título debe tener al menos 3 caracteres",
    })
    .max(80, {
      message: "El título no puede tener más de 80 caracteres",
    }),
  description: z
    .string()
    .min(10, {
      message: "La descripción debe tener al menos 10 caracteres",
    })
    .max(150, {
      message: "La descripción no puede tener más de 150 caracteres",
    }),
  category: z.string({
    required_error: "Por favor selecciona una categoría",
  }),
  goalAmount: z.coerce.number().min(1, {
    message: "Por favor ingresa un monto mayor a cero",
  }),
  location: z.enum([
    "la_paz",
    "santa_cruz",
    "cochabamba",
    "sucre",
    "oruro",
    "potosi",
    "tarija",
    "beni",
    "pando",
  ]),
  endDate: z
    .date({
      required_error: "Por favor selecciona una fecha",
    })
    .refine((date) => date > new Date(), {
      message: "La fecha debe ser en el futuro",
    }),
});

export function Step1BasicInfo() {
  const { state, dispatch, nextStep, saveDraft } = useCampaignForm();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: state.title,
      description: state.description,
      category: state.category,
      goalAmount: state.goalAmount || undefined,
      location: state.location,
      endDate: state.endDate ? new Date(state.endDate) : undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    dispatch({ type: "SET_TITLE", payload: values.title });
    dispatch({ type: "SET_DESCRIPTION", payload: values.description });
    dispatch({ type: "SET_CATEGORY", payload: values.category });
    dispatch({ type: "SET_GOAL_AMOUNT", payload: values.goalAmount });
    dispatch({ type: "SET_LOCATION", payload: values.location });
    dispatch({ type: "SET_END_DATE", payload: values.endDate.toISOString() });

    await saveDraft();
    nextStep();
  };

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Allow multiple file uploads
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        setUploading(true);

        // Create FormData object
        const formData = new FormData();
        formData.append("file", file);

        // Upload file to the server
        const response = await axios.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        });

        if (response.data.success) {
          // Add the uploaded media to the state
          dispatch({
            type: "ADD_MEDIA",
            payload: {
              mediaUrl: response.data.url,
              type: response.data.type,
              isPrimary: state.media.length === 0, // First media is primary by default
              orderIndex: state.media.length,
            },
          });

          toast({
            title: "Archivo cargado correctamente",
            description: `${file.name} se ha subido con éxito.`,
          });
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Error al cargar el archivo",
          description:
            "Hubo un problema al cargar el archivo. Inténtalo de nuevo.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }

    // Reset the file input
    e.target.value = "";
  };

  const handleVideoUrl = (url: string) => {
    dispatch({ type: "SET_YOUTUBE_URL", payload: url });
  };

  const handleRemoveMedia = (mediaUrl: string) => {
    dispatch({ type: "REMOVE_MEDIA", payload: mediaUrl });
  };

  const handleSetPrimaryMedia = (mediaUrl: string) => {
    dispatch({ type: "SET_PRIMARY_MEDIA", payload: mediaUrl });
  };

  // Add function to format number with thousands separators
  const formatNumberWithSeparators = (value: string | number): string => {
    // Convert to string and remove any non-digit characters first
    const stringValue = String(value || "");
    const numericValue = stringValue.replace(/\D/g, "");

    // Return empty string if no digits
    if (!numericValue) return "";

    // Add thousands separators (dots)
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Add function to remove separators and get raw numeric value
  const removeNumberSeparators = (value: string): string => {
    return value.replace(/\./g, "");
  };

  // Add function to handle goal amount input change
  const handleGoalAmountChange = (
    onChange: (value: number | undefined) => void
  ) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Only allow digits and dots (for existing separators)
      const numericOnly = inputValue.replace(/[^\d.]/g, "");

      // Remove existing separators to get raw value
      const rawValue = removeNumberSeparators(numericOnly);

      // Convert to number or undefined if empty
      onChange(rawValue ? Number(rawValue) : undefined);
    };
  };

  if (state.isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" showText text="Guardando..." />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
        {/* Campaign Name */}
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="pt-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Nombre de la campaña
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Dale un nombre claro a tu campaña y agrega una breve explicación
                o detalle para transmitir rápidamente su esencia y objetivo.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-black p-8">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">
                        Nombre de la campaña
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingresa el nombre de tu campaña"
                          className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4"
                          {...field}
                          maxLength={80}
                        />
                      </FormControl>
                      <div className="text-sm text-gray-500 text-right mt-1">
                        {field.value?.length || 0}/80
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">
                        Detalle
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ejemplo: Su conservación depende de nosotros"
                          rows={4}
                          className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 p-4"
                          {...field}
                          maxLength={150}
                        />
                      </FormControl>
                      <div className="text-sm text-gray-500 text-right mt-1">
                        {field.value?.length || 0}/150
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="mt-16 border-b border-[#478C5C]/20" />
        </div>

        {/* Category */}
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="pt-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Selecciona una categoría
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Categoriza una categoría y tu campaña va ser encontrada más
                fácilmente por los donadores potenciales.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-black p-8">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium">
                      Categoría
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cultura_arte">
                          Cultura y Arte
                        </SelectItem>
                        <SelectItem value="educacion">Educación</SelectItem>
                        <SelectItem value="emergencia">Emergencia</SelectItem>
                        <SelectItem value="igualdad">Igualdad</SelectItem>
                        <SelectItem value="medioambiente">
                          Medio ambiente
                        </SelectItem>
                        <SelectItem value="salud">Salud</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="mt-16 border-b border-[#478C5C]/20" />
        </div>

        {/* Fundraising Goal */}
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="pt-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Establece una meta de recaudación
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Define una meta realista que te ayude a alcanzar el objetivo de
                tu campaña.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-black p-8">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="goalAmount"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium">
                        Meta de recaudación
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Ingresa el monto a recaudar"
                          className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4"
                          value={formatNumberWithSeparators(value || "")}
                          onChange={handleGoalAmountChange(onChange)}
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2 bg-[#EDF2FF] border border-[#365AFF] rounded-lg p-2 mt-4">
                  <Image
                    src="/icons/info.svg"
                    alt="Info"
                    width={20}
                    height={20}
                  />
                  <span className="text-base text-gray-600">
                    Este será el monto objetivo de tu campaña
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-b border-[#478C5C]/20" />
        </div>

        {/* Location */}
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="pt-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                ¿Dónde se llevará a cabo?
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Indica dónde se realizará tu campaña para que los donantes sepan
                dónde tendrá impacto.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-black p-8">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium">
                      Ubicación
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 pl-12 pr-4">
                            <SelectValue placeholder="Selecciona una ubicación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="la_paz">La Paz</SelectItem>
                            <SelectItem value="santa_cruz">
                              Santa Cruz
                            </SelectItem>
                            <SelectItem value="cochabamba">
                              Cochabamba
                            </SelectItem>
                            <SelectItem value="sucre">Sucre</SelectItem>
                            <SelectItem value="oruro">Oruro</SelectItem>
                            <SelectItem value="potosi">Potosí</SelectItem>
                            <SelectItem value="tarija">Tarija</SelectItem>
                            <SelectItem value="beni">Beni</SelectItem>
                            <SelectItem value="pando">Pando</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="mt-16 border-b border-[#478C5C]/20" />
        </div>

        {/* End Date */}
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="pt-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Fecha de finalización
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Establece cuándo finalizará tu campaña. Recomendamos un período
                de 30 a 90 días para mantener el impulso y la urgencia.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-black p-8">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg font-medium">
                      Fecha de finalización
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 pl-12 pr-4 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="mt-16 border-b border-[#478C5C]/20" />
        </div>

        {/* Media Upload */}
        <div className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="pt-4">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Agrega fotos y videos que ilustren tu causa
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Imágenes poderosas que cuenten tu historia harán que tu campaña
                sea más personal y emotiva. Esto ayudará a inspirar y conectar
                con más personas que apoyen tu causa.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-black p-8">
              <div className="space-y-6">
                <label>
                  <div className="border-2 border-dashed border-gray-400 rounded-lg p-10 text-center bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      {uploading ? (
                        <div className="w-full">
                          <LoadingSpinner
                            size="sm"
                            showText
                            text="Subiendo..."
                          />
                          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-[#2c6e49] h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="h-10 w-10 text-[#2c6e49] mb-4" />
                          <p className="text-sm text-gray-500 mb-4">
                            Arrastra o carga tus fotos y videos aquí
                          </p>
                          <p className="text-xs text-gray-400 mb-4">
                            Archivos en formato JPEG, PNG (máx. 5MB) o MP4 (máx.
                            5MB)
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-[#2c6e49] text-white hover:bg-[#1e4d33] border-0 rounded-full"
                          >
                            Seleccionar archivos
                          </Button>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,video/mp4"
                            className="hidden"
                            onChange={handleUploadMedia}
                            multiple
                          />
                        </>
                      )}
                    </div>
                  </div>
                </label>

                {/* YouTube URL Input */}
                <div className="flex items-center justify-center my-6">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className="px-4 text-gray-500">O</div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div>
                  <label className="block text-lg font-medium mb-2">
                    Agrega un video de YouTube
                  </label>
                  <input
                    type="text"
                    placeholder="Ingresa la URL del video de YouTube"
                    className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4"
                    value={state.youtubeUrl || ""}
                    onChange={(e) => handleVideoUrl(e.target.value)}
                  />
                </div>

                {/* Media Preview */}
                {state.media.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">
                      Medios cargados ({state.media.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {state.media.map((item, index) => (
                        <div
                          key={index}
                          className={`relative rounded-lg overflow-hidden border-2 ${
                            item.isPrimary
                              ? "border-[#478C5C]"
                              : "border-gray-200"
                          }`}
                        >
                          {item.type === "image" ? (
                            <img
                              src={item.mediaUrl}
                              alt={`Media ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <video
                              src={item.mediaUrl}
                              className="w-full h-32 object-cover"
                              controls
                            />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetPrimaryMedia(item.mediaUrl)
                                }
                                className="bg-white p-1 rounded-full shadow-md hover:bg-gray-100"
                                title={
                                  item.isPrimary
                                    ? "Imagen principal"
                                    : "Establecer como principal"
                                }
                              >
                                {item.isPrimary ? "✓" : "○"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(item.mediaUrl)}
                                className="bg-white p-1 rounded-full shadow-md hover:bg-gray-100"
                                title="Eliminar"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                          {item.isPrimary && (
                            <div className="absolute bottom-0 left-0 right-0 bg-[#478C5C] text-white text-xs py-1 text-center">
                              Imagen principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-12 py-6 rounded-full text-xl"
          >
            Continuar
          </Button>
        </div>
      </form>
    </Form>
  );
}
