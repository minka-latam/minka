"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  UserCheck,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/providers/auth-provider";

interface VerificationRequest {
  id: string;
  campaignId: string;
  campaignTitle: string;
  organizerName: string;
  organizerId: string;
  requestDate: string | null;
  status: "pending" | "approved" | "rejected" | "unverified";
  notes?: string;
  idDocumentUrl?: string;
  supportingDocsUrls?: string[];
  campaignStory?: string;
  referenceContactName?: string;
  referenceContactEmail?: string;
  referenceContactPhone?: string;
  campaignImage?: string;
}

export default function CampaignVerificationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [verificationRequests, setVerificationRequests] = useState<
    VerificationRequest[]
  >([]);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<
    "approve" | "reject" | "unverify" | null
  >(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [currentTab, setCurrentTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Document viewer modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string>("");
  const [currentDocumentTitle, setCurrentDocumentTitle] = useState<string>("");
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState<number>(0);
  const [documentList, setDocumentList] = useState<
    { url: string; title: string }[]
  >([]);

  // Fetch verification requests on component mount
  useEffect(() => {
    const fetchVerificationRequests = async () => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        setLoading(true);

        // Check if user is admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        // Fetch verification requests from API
        const response = await fetch(
          "/api/admin/verification-requests?status=all",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch verification requests: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Format verification requests to match existing interface
        const formattedRequests: VerificationRequest[] = data.campaigns.map(
          (item: any) => ({
            id: item.id,
            campaignId: item.id,
            campaignTitle: item.campaignTitle,
            organizerName: item.organizerName,
            organizerId: item.organizerId,
            requestDate: item.requestDate,
            status: item.status,
            notes: item.notes,
            idDocumentUrl: item.idDocumentUrl,
            supportingDocsUrls: item.supportingDocsUrls || [],
            campaignStory: item.campaignStory,
            referenceContactName: item.referenceContactName,
            referenceContactEmail: item.referenceContactEmail,
            referenceContactPhone: item.referenceContactPhone,
            campaignImage: item.campaignImage,
          })
        );

        setVerificationRequests(formattedRequests);
      } catch (error) {
        console.error("Error in verification page:", error);
        toast({
          title: "Error",
          description:
            "Ocurrió un error al cargar las solicitudes de verificación.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationRequests();
  }, [user, router, supabase, toast]);

  // Handle view request details
  const handleViewRequest = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setNoteText(request.notes || "");
  };

  // Open confirmation dialog
  const openConfirmationDialog = (
    action: "approve" | "reject" | "unverify"
  ) => {
    if (!selectedRequest) return;

    setDialogAction(action);
    setShowDialog(true);
  };

  // Handle approve or reject request
  const handleConfirmAction = async () => {
    if (!selectedRequest || !dialogAction) return;

    setProcessingAction(true);

    try {
      // Update verification status via API
      const response = await fetch("/api/campaign/verification/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: selectedRequest.campaignId,
          status:
            dialogAction === "approve"
              ? "approved"
              : dialogAction === "reject"
                ? "rejected"
                : "pending",
          notes: noteText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to update verification status: ${response.statusText}`
        );
      }

      // Update local state
      setVerificationRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? {
                ...req,
                status:
                  dialogAction === "approve"
                    ? "approved"
                    : dialogAction === "reject"
                      ? "rejected"
                      : "pending",
                notes: noteText,
              }
            : req
        )
      );

      toast({
        title:
          dialogAction === "approve"
            ? "Campaña aprobada"
            : dialogAction === "reject"
              ? "Campaña rechazada"
              : "Verificación revocada",
        description:
          dialogAction === "approve"
            ? "La campaña ha sido verificada exitosamente."
            : dialogAction === "reject"
              ? "La campaña ha sido rechazada."
              : "La verificación de la campaña ha sido revocada.",
      });

      // Close dialog and reset selection
      setShowDialog(false);
      setSelectedRequest(null);
      setDialogAction(null);
    } catch (error) {
      console.error("Error processing verification action:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la acción. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Helper functions for document viewer
  const openDocumentModal = (
    url: string,
    title: string,
    allDocs?: { url: string; title: string }[],
    index?: number
  ) => {
    setCurrentDocumentUrl(url);
    setCurrentDocumentTitle(title);
    if (allDocs && index !== undefined) {
      setDocumentList(allDocs);
      setCurrentDocumentIndex(index);
    } else {
      setDocumentList([{ url, title }]);
      setCurrentDocumentIndex(0);
    }
    setShowDocumentModal(true);
  };

  const navigateDocument = (direction: "prev" | "next") => {
    if (documentList.length <= 1) return;

    let newIndex;
    if (direction === "prev") {
      newIndex =
        currentDocumentIndex > 0
          ? currentDocumentIndex - 1
          : documentList.length - 1;
    } else {
      newIndex =
        currentDocumentIndex < documentList.length - 1
          ? currentDocumentIndex + 1
          : 0;
    }

    setCurrentDocumentIndex(newIndex);
    setCurrentDocumentUrl(documentList[newIndex].url);
    setCurrentDocumentTitle(documentList[newIndex].title);
  };

  const isImageFile = (url: string) => {
    return (
      url.toLowerCase().includes(".jpg") ||
      url.toLowerCase().includes(".jpeg") ||
      url.toLowerCase().includes(".png") ||
      url.toLowerCase().includes(".gif") ||
      url.toLowerCase().includes(".webp")
    );
  };

  // Filter requests by status
  const filteredRequests = verificationRequests.filter((req) => {
    // Filter by tab/status
    if (currentTab === "pending" && req.status !== "pending") return false;
    if (currentTab === "approved" && req.status !== "approved") return false;
    if (currentTab === "rejected" && req.status !== "rejected") return false;
    if (currentTab === "unverified" && req.status !== "unverified")
      return false;
    // For "all" tab, don't filter by status

    // Filter by search term if present
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      return (
        req.campaignTitle.toLowerCase().includes(term) ||
        req.organizerName.toLowerCase().includes(term) ||
        req.campaignId.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Verificación de Campañas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-600 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                verificationRequests.filter((r) => r.status === "pending")
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-600 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                verificationRequests.filter((r) => r.status === "approved")
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-600 flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              Rechazadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                verificationRequests.filter((r) => r.status === "rejected")
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-600 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              No Verificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                verificationRequests.filter((r) => r.status === "unverified")
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="pending"
        className="w-full"
        value={currentTab}
        onValueChange={setCurrentTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
          <TabsTrigger value="unverified">No Verificadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="space-y-4">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre de campaña, organizador o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2c6e49]"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>

          {filteredRequests.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Campaña</TableHead>
                    <TableHead>Organizador</TableHead>
                    <TableHead>Fecha de solicitud</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {request.campaignImage && (
                            <div className="relative w-10 h-10 rounded-md overflow-hidden">
                              <Image
                                src={request.campaignImage}
                                alt={request.campaignTitle}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="truncate max-w-[180px]">
                            {request.campaignTitle}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.organizerName}</TableCell>
                      <TableCell>
                        {request.requestDate
                          ? formatDistanceToNow(new Date(request.requestDate), {
                              addSuffix: true,
                              locale: es,
                            })
                          : "Sin solicitud"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : request.status === "approved"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : request.status === "rejected"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {request.status === "pending"
                            ? "Pendiente"
                            : request.status === "approved"
                              ? "Aprobada"
                              : request.status === "rejected"
                                ? "Rechazada"
                                : "No Verificada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          Revisar
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/campaign/${request.campaignId}`}>
                            <ExternalLink className="mr-1 h-4 w-4" /> Ver
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg py-16 px-4 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg text-center">
                No hay solicitudes de verificación{" "}
                {currentTab === "all"
                  ? ""
                  : currentTab === "pending"
                    ? "pendientes"
                    : currentTab === "approved"
                      ? "aprobadas"
                      : currentTab === "rejected"
                        ? "rechazadas"
                        : "no verificadas"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Details Sidebar */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl overflow-y-auto h-full">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">Detalles de verificación</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Campaign Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Información de la campaña</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-gray-500">
                          Título
                        </p>
                        <p className="text-base font-medium">
                          {selectedRequest.campaignTitle}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Organizador
                        </p>
                        <p className="text-base">
                          {selectedRequest.organizerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Fecha de solicitud
                        </p>
                        <p className="text-base">
                          {selectedRequest.requestDate
                            ? new Date(
                                selectedRequest.requestDate
                              ).toLocaleDateString("es-ES")
                            : "Sin solicitud"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Estado
                        </p>
                        <Badge
                          className={
                            selectedRequest.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : selectedRequest.status === "approved"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : selectedRequest.status === "rejected"
                                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {selectedRequest.status === "pending"
                            ? "Pendiente"
                            : selectedRequest.status === "approved"
                              ? "Aprobada"
                              : selectedRequest.status === "rejected"
                                ? "Rechazada"
                                : "No Verificada"}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Imagen principal
                      </p>
                      {selectedRequest.campaignImage ? (
                        <div className="mt-2 relative w-full h-48 rounded-md overflow-hidden">
                          <Image
                            src={selectedRequest.campaignImage}
                            alt={selectedRequest.campaignTitle}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Sin imagen</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ID Document Upload - Matching verification form style */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-2xl font-medium">
                      Documento de Identidad
                    </CardTitle>
                    <p className="text-gray-600">
                      Documentos de identidad subidos para validar la
                      información personal como responsable de la campaña.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedRequest.idDocumentUrl && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ID Document Front */}
                        <div className="bg-white rounded-xl border border-black p-6">
                          <h4 className="font-medium text-lg mb-4">
                            Anverso de la Identificación
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">
                                Documento principal
                              </span>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                              {selectedRequest.idDocumentUrl
                                ?.toLowerCase()
                                .includes(".jpg") ||
                              selectedRequest.idDocumentUrl
                                ?.toLowerCase()
                                .includes(".jpeg") ||
                              selectedRequest.idDocumentUrl
                                ?.toLowerCase()
                                .includes(".png") ? (
                                <div
                                  className="cursor-pointer"
                                  onClick={() =>
                                    selectedRequest.idDocumentUrl &&
                                    openDocumentModal(
                                      selectedRequest.idDocumentUrl,
                                      "Anverso del documento de identidad"
                                    )
                                  }
                                >
                                  <div className="relative">
                                    <Image
                                      src={selectedRequest.idDocumentUrl!}
                                      alt="Anverso del documento"
                                      width={300}
                                      height={200}
                                      className="w-full h-48 object-contain bg-gray-100 hover:opacity-90 transition-opacity"
                                    />
                                    <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm">
                                      <Eye
                                        size={16}
                                        className="text-gray-600"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="flex items-center gap-3 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() =>
                                    selectedRequest.idDocumentUrl &&
                                    openDocumentModal(
                                      selectedRequest.idDocumentUrl,
                                      "Anverso del documento de identidad"
                                    )
                                  }
                                >
                                  <FileText
                                    size={24}
                                    className="text-gray-500"
                                  />
                                  <span className="text-sm text-gray-800">
                                    Documento de identidad
                                  </span>
                                  <div className="ml-auto">
                                    <Eye size={16} className="text-gray-600" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center text-green-700">
                              <CheckCircle2 size={16} className="mr-2" />
                              <span className="text-sm">
                                Documento cargado correctamente
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ID Document Back (from supporting docs) */}
                        {selectedRequest.supportingDocsUrls &&
                          selectedRequest.supportingDocsUrls.length > 0 && (
                            <div className="bg-white rounded-xl border border-black p-6">
                              <h4 className="font-medium text-lg mb-4">
                                Reverso de la Identificación
                              </h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-700 font-medium">
                                    Reverso del documento
                                  </span>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                  {selectedRequest.supportingDocsUrls?.[0]
                                    ?.toLowerCase()
                                    .includes(".jpg") ||
                                  selectedRequest.supportingDocsUrls?.[0]
                                    ?.toLowerCase()
                                    .includes(".jpeg") ||
                                  selectedRequest.supportingDocsUrls?.[0]
                                    ?.toLowerCase()
                                    .includes(".png") ? (
                                    <div
                                      className="cursor-pointer"
                                      onClick={() =>
                                        selectedRequest
                                          .supportingDocsUrls?.[0] &&
                                        openDocumentModal(
                                          selectedRequest.supportingDocsUrls[0],
                                          "Reverso del documento de identidad"
                                        )
                                      }
                                    >
                                      <div className="relative">
                                        <Image
                                          src={
                                            selectedRequest
                                              .supportingDocsUrls![0]
                                          }
                                          alt="Reverso del documento"
                                          width={300}
                                          height={200}
                                          className="w-full h-48 object-contain bg-gray-100 hover:opacity-90 transition-opacity"
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm">
                                          <Eye
                                            size={16}
                                            className="text-gray-600"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center gap-3 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                      onClick={() =>
                                        selectedRequest
                                          .supportingDocsUrls?.[0] &&
                                        openDocumentModal(
                                          selectedRequest.supportingDocsUrls[0],
                                          "Reverso del documento de identidad"
                                        )
                                      }
                                    >
                                      <FileText
                                        size={24}
                                        className="text-gray-500"
                                      />
                                      <span className="text-sm text-gray-800">
                                        Reverso del documento
                                      </span>
                                      <div className="ml-auto">
                                        <Eye
                                          size={16}
                                          className="text-gray-600"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center text-green-700">
                                  <CheckCircle2 size={16} className="mr-2" />
                                  <span className="text-sm">
                                    Documento cargado correctamente
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Supporting Documents - Matching verification form style */}
                {selectedRequest.supportingDocsUrls &&
                  selectedRequest.supportingDocsUrls.length > 1 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-2xl font-medium">
                          Documentación de apoyo
                        </CardTitle>
                        <p className="text-gray-600">
                          Documentos que respaldan la legitimidad de la campaña
                          (cotizaciones, recibos, prescripciones médicas, etc.)
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl border border-black p-8">
                          <h3 className="text-lg font-medium mb-3">
                            Documentos cargados (
                            {selectedRequest.supportingDocsUrls.length - 1})
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedRequest.supportingDocsUrls
                              .slice(1)
                              .map((url, index) => (
                                <div
                                  key={index}
                                  className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                                  onClick={() => {
                                    const allSupportingDocs = selectedRequest
                                      .supportingDocsUrls!.slice(1)
                                      .map((docUrl, docIndex) => ({
                                        url: docUrl,
                                        title: `Documento de apoyo ${docIndex + 1}`,
                                      }));
                                    openDocumentModal(
                                      url,
                                      `Documento de apoyo ${index + 1}`,
                                      allSupportingDocs,
                                      index
                                    );
                                  }}
                                >
                                  {url.toLowerCase().includes(".jpg") ||
                                  url.toLowerCase().includes(".jpeg") ||
                                  url.toLowerCase().includes(".png") ? (
                                    <>
                                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                                        <Image
                                          src={url}
                                          alt={`Documento ${index + 1}`}
                                          fill
                                          className="object-cover"
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm">
                                          <Eye
                                            size={16}
                                            className="text-gray-600"
                                          />
                                        </div>
                                      </div>
                                      <div className="p-2 bg-white">
                                        <p className="text-sm font-medium">
                                          Documento de apoyo {index + 1}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-3 bg-white p-3">
                                      <FileText
                                        size={24}
                                        className="text-blue-500"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">
                                          Documento de apoyo {index + 1}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Archivo adjunto
                                        </p>
                                      </div>
                                      <div className="ml-auto">
                                        <Eye
                                          size={16}
                                          className="text-gray-600"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Campaign History - Matching verification form style */}
                {selectedRequest.campaignStory && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-2xl font-medium">
                        Historia de la campaña
                      </CardTitle>
                      <p className="text-gray-600">
                        Descripción de cómo se van a emplear los fondos
                        recaudados, por qué esta campaña es importante, cómo se
                        planea llevar a cabo y quién es el responsable.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white rounded-xl border border-black p-8">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-lg font-medium mb-2">
                              Historia proporcionada
                            </label>
                            <div className="relative">
                              <div className="w-full rounded-lg border border-black bg-gray-50 p-4 min-h-[120px]">
                                <p className="text-gray-700 whitespace-pre-line">
                                  {selectedRequest.campaignStory}
                                </p>
                              </div>
                              <div className="text-sm text-gray-500 text-right mt-1">
                                {selectedRequest.campaignStory.length}{" "}
                                caracteres
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contact Reference - Matching verification form style */}
                {(selectedRequest.referenceContactName ||
                  selectedRequest.referenceContactEmail ||
                  selectedRequest.referenceContactPhone) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-2xl font-medium">
                        Contacto de referencia (opcional)
                      </CardTitle>
                      <p className="text-gray-600">
                        Contacto que puede confirmar la autenticidad de la
                        campaña.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white rounded-xl border border-black p-8">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">
                              Contacto de referencia
                            </h4>
                          </div>
                          <div className="bg-[#f5f7e9] p-4 rounded-lg space-y-3">
                            {selectedRequest.referenceContactName && (
                              <p>
                                <span className="font-medium">Nombre:</span>{" "}
                                {selectedRequest.referenceContactName}
                              </p>
                            )}
                            {selectedRequest.referenceContactEmail && (
                              <p>
                                <span className="font-medium">Email:</span>{" "}
                                {selectedRequest.referenceContactEmail}
                              </p>
                            )}
                            {selectedRequest.referenceContactPhone && (
                              <p>
                                <span className="font-medium">Teléfono:</span>{" "}
                                {selectedRequest.referenceContactPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Notes */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Notas administrativas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Ingrese sus notas sobre esta solicitud de verificación"
                      className="min-h-[120px]"
                      disabled={selectedRequest.status !== "pending"}
                    />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Cerrar
                  </Button>

                  {selectedRequest.status === "unverified" && (
                    <div className="text-sm text-gray-500">
                      Esta campaña aún no ha solicitado verificación.
                    </div>
                  )}

                  {selectedRequest.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => openConfirmationDialog("reject")}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>

                      <Button
                        variant="default"
                        onClick={() => openConfirmationDialog("approve")}
                        className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprobar
                      </Button>
                    </>
                  )}

                  {selectedRequest.status === "approved" && (
                    <Button
                      variant="outline"
                      onClick={() => openConfirmationDialog("unverify")}
                      className="border-amber-200 text-amber-600 hover:bg-amber-50"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Revocar verificación
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {currentDocumentTitle}
                </DialogTitle>
                {documentList.length > 1 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Documento {currentDocumentIndex + 1} de{" "}
                    {documentList.length}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {documentList.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDocument("prev")}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDocument("next")}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              {isImageFile(currentDocumentUrl) ? (
                <div className="relative w-full" style={{ height: "70vh" }}>
                  <Image
                    src={currentDocumentUrl}
                    alt={currentDocumentTitle}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      console.error("Error loading image:", e);
                    }}
                  />
                </div>
              ) : (
                <div className="w-full relative" style={{ height: "70vh" }}>
                  <iframe
                    src={currentDocumentUrl}
                    className="w-full h-full border-0"
                    title={currentDocumentTitle}
                    onLoad={(e) => {
                      // Check if iframe loaded successfully
                      try {
                        const iframe = e.target as HTMLIFrameElement;
                        if (!iframe.contentDocument) {
                          // Show fallback if can't access content (likely blocked)
                          const fallback =
                            iframe.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }
                      } catch (error) {
                        console.error("Iframe access error:", error);
                      }
                    }}
                  />
                  {/* Fallback for documents that can't be embedded */}
                  <div
                    className="absolute inset-0 hidden items-center justify-center bg-gray-100 text-gray-600"
                    style={{ display: "none" }}
                  >
                    <div className="text-center">
                      <FileText size={48} className="mx-auto mb-4" />
                      <p className="mb-4">
                        No se puede mostrar este documento en el navegador
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation hints */}
            {documentList.length > 1 && (
              <div className="mt-4 flex justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Usa las flechas ← → para navegar entre documentos</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve"
                ? "¿Aprobar solicitud de verificación?"
                : dialogAction === "reject"
                  ? "¿Rechazar solicitud de verificación?"
                  : "¿Revocar verificación de la campaña?"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? "Esta acción marcará la campaña como verificada. Los usuarios podrán ver un distintivo de verificación en la campaña."
                : dialogAction === "reject"
                  ? "Esta acción rechazará la solicitud de verificación. El organizador será notificado."
                  : "Esta acción revocará la verificación de la campaña. La campaña dejará de tener un distintivo de verificación."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-500">
              Campaña: {selectedRequest?.campaignTitle}
            </p>
            <p className="text-sm text-gray-500">
              Organizador: {selectedRequest?.organizerName}
            </p>

            {dialogAction === "unverify" && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-sm font-bold text-amber-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Acción de Super Administrador
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Revocar la verificación de una campaña es una acción
                  importante que debería usarse con precaución. Los donantes
                  pueden haber confiado en el distintivo de verificación para
                  realizar donaciones.
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  Asegúrese de incluir una nota explicando el motivo de la
                  revocación en el campo de notas administrativas.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={processingAction}
            >
              Cancelar
            </Button>
            <Button
              variant={
                dialogAction === "approve"
                  ? "default"
                  : dialogAction === "reject"
                    ? "destructive"
                    : "outline"
              }
              onClick={handleConfirmAction}
              disabled={processingAction}
              className={
                dialogAction === "approve"
                  ? "bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
                  : dialogAction === "reject"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }
            >
              {processingAction ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Procesando...
                </>
              ) : (
                <>
                  {dialogAction === "approve" ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprobar
                    </>
                  ) : dialogAction === "reject" ? (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Revocar
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

