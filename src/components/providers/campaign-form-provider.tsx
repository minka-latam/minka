"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export type MediaItem = {
  mediaUrl: string;
  previewUrl?: string | null;
  type: "image" | "video";
  isPrimary: boolean;
  orderIndex: number;
  id?: string;
};

export type CampaignFormState = {
  currentStep: number;
  campaignId: string | null;
  title: string;
  description: string;
  category: string;
  goalAmount: number;
  location:
    | "la_paz"
    | "santa_cruz"
    | "cochabamba"
    | "sucre"
    | "oruro"
    | "potosi"
    | "tarija"
    | "beni"
    | "pando";
  province?: string;
  endDate: string;
  youtubeUrl: string;
  media: MediaItem[];
  beneficiariesDescription: string;
  isSubmitting: boolean;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  status: "draft" | "active" | "completed" | "cancelled";
  previewMode: boolean;
};

type CampaignFormAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_CAMPAIGN_ID"; payload: string }
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "SET_GOAL_AMOUNT"; payload: number }
  | { type: "SET_LOCATION"; payload: string }
  | { type: "SET_PROVINCE"; payload: string | undefined }
  | { type: "SET_END_DATE"; payload: string }
  | { type: "SET_YOUTUBE_URL"; payload: string }
  | { type: "ADD_MEDIA"; payload: MediaItem }
  | { type: "REMOVE_MEDIA"; payload: string }
  | { type: "SET_PRIMARY_MEDIA"; payload: string }
  | { type: "SET_BENEFICIARIES_DESCRIPTION"; payload: string }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | {
      type: "SET_AUTO_SAVE_STATUS";
      payload: "idle" | "saving" | "saved" | "error";
    }
  | {
      type: "SET_STATUS";
      payload: "draft" | "active" | "completed" | "cancelled";
    }
  | { type: "LOAD_CAMPAIGN"; payload: CampaignFormState }
  | { type: "TOGGLE_PREVIEW_MODE" };

const initialState: CampaignFormState = {
  currentStep: 1,
  campaignId: null,
  title: "",
  description: "",
  category: "",
  goalAmount: 0,
  location: "la_paz",
  province: undefined,
  endDate: "",
  youtubeUrl: "",
  media: [],
  beneficiariesDescription: "",
  isSubmitting: false,
  autoSaveStatus: "idle",
  status: "draft",
  previewMode: false,
};

const reducer = (
  state: CampaignFormState,
  action: CampaignFormAction
): CampaignFormState => {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_CAMPAIGN_ID":
      return { ...state, campaignId: action.payload };
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_GOAL_AMOUNT":
      return { ...state, goalAmount: action.payload };
    case "SET_LOCATION":
      return {
        ...state,
        location: action.payload as
          | "la_paz"
          | "santa_cruz"
          | "cochabamba"
          | "sucre"
          | "oruro"
          | "potosi"
          | "tarija"
          | "beni"
          | "pando",
      };
    case "SET_PROVINCE":
      return { ...state, province: action.payload };
    case "SET_END_DATE":
      return { ...state, endDate: action.payload };
    case "SET_YOUTUBE_URL":
      return { ...state, youtubeUrl: action.payload };
    case "ADD_MEDIA":
      return {
        ...state,
        media: [...state.media, action.payload],
      };
    case "REMOVE_MEDIA":
      return {
        ...state,
        media: state.media.filter((item) => item.mediaUrl !== action.payload),
      };
    case "SET_PRIMARY_MEDIA":
      return {
        ...state,
        media: state.media.map((item) => ({
          ...item,
          isPrimary: item.mediaUrl === action.payload,
        })),
      };
    case "SET_BENEFICIARIES_DESCRIPTION":
      return { ...state, beneficiariesDescription: action.payload };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    case "SET_AUTO_SAVE_STATUS":
      return { ...state, autoSaveStatus: action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "LOAD_CAMPAIGN":
      return { ...state, ...action.payload };
    case "TOGGLE_PREVIEW_MODE":
      return { ...state, previewMode: !state.previewMode };
    default:
      return state;
  }
};

type CampaignFormContextType = {
  state: CampaignFormState;
  dispatch: React.Dispatch<CampaignFormAction>;
  nextStep: () => void;
  prevStep: () => void;
  saveDraft: () => Promise<void>;
  submitCampaign: () => Promise<void>;
  loadCampaign: (id: string) => Promise<void>;
  togglePreviewMode: () => void;
};

const CampaignFormContext = createContext<CampaignFormContextType | undefined>(
  undefined
);

export const CampaignFormProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  const router = useRouter();

  // Auto-save when values change
  useEffect(() => {
    const autoSave = async () => {
      // Don't auto-save if we're in the first step and haven't entered anything meaningful yet
      if (
        state.currentStep === 1 &&
        !state.title &&
        !state.description &&
        !state.category
      ) {
        return;
      }

      if (
        state.autoSaveStatus !== "saving" &&
        (state.title ||
          state.description ||
          state.category ||
          state.media.length > 0)
      ) {
        try {
          dispatch({ type: "SET_AUTO_SAVE_STATUS", payload: "saving" });

          await axios.post("/api/campaign/draft", {
            campaignId: state.campaignId,
            title: state.title,
            description: state.description,
            beneficiariesDescription: state.beneficiariesDescription,
            category: state.category,
            goalAmount: state.goalAmount,
            location: state.location,
            endDate: state.endDate,
            youtubeUrl: state.youtubeUrl,
            media: state.media,
          });

          dispatch({ type: "SET_AUTO_SAVE_STATUS", payload: "saved" });
        } catch (error) {
          console.error("Error auto-saving campaign:", error);
          dispatch({ type: "SET_AUTO_SAVE_STATUS", payload: "error" });
        }
      }
    };

    const timer = setTimeout(autoSave, 3000);
    return () => clearTimeout(timer);
  }, [state.title, state.description, state.category, state.goalAmount, state.location, state.endDate, state.beneficiariesDescription, state.media, state.currentStep, state.autoSaveStatus, state.campaignId, state.youtubeUrl]);

  const nextStep = () => {
    if (state.currentStep < 3) {
      dispatch({ type: "SET_STEP", payload: state.currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: "SET_STEP", payload: state.currentStep - 1 });
    }
  };

  const saveDraft = async () => {
    try {
      dispatch({ type: "SET_SUBMITTING", payload: true });

      const response = await axios.post("/api/campaign/draft", {
        campaignId: state.campaignId,
        title: state.title,
        description: state.description,
        beneficiariesDescription: state.beneficiariesDescription,
        category: state.category,
        goalAmount: state.goalAmount,
        location: state.location,
        endDate: state.endDate,
        youtubeUrl: state.youtubeUrl,
        media: state.media,
      });

      if (!state.campaignId) {
        dispatch({
          type: "SET_CAMPAIGN_ID",
          payload: response.data.campaignId,
        });
      }

      toast({
        title: "Borrador guardado",
        description: "Tu campaña ha sido guardada como borrador.",
      });

      dispatch({ type: "SET_SUBMITTING", payload: false });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description:
          "Hubo un error al guardar el borrador. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  const submitCampaign = async () => {
    try {
      dispatch({ type: "SET_SUBMITTING", payload: true });

      const response = await axios.post("/api/campaign/create", {
        title: state.title,
        description: state.description,
        beneficiariesDescription: state.beneficiariesDescription,
        category: state.category,
        goalAmount: state.goalAmount,
        location: state.location,
        endDate: state.endDate,
        youtubeUrl: state.youtubeUrl,
        media: state.media,
      });

      toast({
        title: "¡Campaña creada con éxito!",
        description: "Tu campaña ha sido enviada para verificación.",
      });

      // Redirect to the campaign page
      router.push(`/campaign/${response.data.campaignId}`);

      dispatch({ type: "SET_SUBMITTING", payload: false });
    } catch (error) {
      console.error("Error submitting campaign:", error);
      toast({
        title: "Error",
        description:
          "Hubo un error al crear la campaña. Por favor, verifica los datos e intenta de nuevo.",
        variant: "destructive",
      });
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  const loadCampaign = async (id: string) => {
    try {
      const response = await axios.get(`/api/campaign/${id}`);
      const campaign = response.data;

      dispatch({
        type: "LOAD_CAMPAIGN",
        payload: {
          ...state,
          campaignId: campaign.id,
          title: campaign.title,
          description: campaign.description,
          beneficiariesDescription: campaign.beneficiariesDescription,
          category: campaign.category,
          goalAmount: Number(campaign.goalAmount),
          location: campaign.location,
          endDate: campaign.endDate,
          youtubeUrl: campaign.youtubeUrl || "",
          media: campaign.media.map((item: any) => ({
            mediaUrl: item.mediaUrl,
            previewUrl: item.previewUrl,
            type: item.type,
            isPrimary: item.isPrimary,
            orderIndex: item.orderIndex,
            id: item.id,
          })),
          status: campaign.campaignStatus,
        },
      });
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la campaña.",
        variant: "destructive",
      });
    }
  };

  const togglePreviewMode = () => {
    dispatch({ type: "TOGGLE_PREVIEW_MODE" });
  };

  return (
    <CampaignFormContext.Provider
      value={{
        state,
        dispatch,
        nextStep,
        prevStep,
        saveDraft,
        submitCampaign,
        loadCampaign,
        togglePreviewMode,
      }}
    >
      {children}
    </CampaignFormContext.Provider>
  );
};

export const useCampaignForm = () => {
  const context = useContext(CampaignFormContext);
  if (context === undefined) {
    throw new Error(
      "useCampaignForm must be used within a CampaignFormProvider"
    );
  }
  return context;
};
