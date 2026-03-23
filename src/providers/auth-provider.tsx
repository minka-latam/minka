"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  role: string;
  created_at: string;
  identity_number?: string;
  birth_date?: string;
  profile_picture?: string;
  [key: string]: string | boolean | number | null | undefined;
}

type SignUpData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentId: string;
  documentCountryCode: string;
  birthDate: string;
  phone: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileFetchInProgress = useRef(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProfile = async (userId: string, retryCount = 0): Promise<Profile | null> => {
    if (profileFetchInProgress.current) {
      console.log("Perfil ya está siendo cargado, omitiendo llamada redundante");
      return null;
    }

    try {
      profileFetchInProgress.current = true;

      const controller = new AbortController();
      const timeoutId = setTimeout(() =>
        controller.abort(new DOMException("Tiempo de espera agotado", "AbortError")),
        10000
      );

      const response = await fetch(`/api/profile/${userId}`, {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error de red" }));
        throw new Error(errorData.error || "Error al obtener el perfil");
      }

      const data = await response.json();

      if (data.profile) {
        setProfile(data.profile);
        return data.profile;
      } else {
        throw new Error("No se recibieron datos del perfil");
      }
    } catch (error) {
      const isRetryable =
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.includes("network") ||
          error.message.includes("fetch"));

      if (retryCount < 2 && isRetryable) {
        profileFetchInProgress.current = false;
        await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 1000));
        return fetchProfile(userId, retryCount + 1);
      }

      setProfile(null);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil.",
        variant: "destructive",
      });
      return null;
    } finally {
      profileFetchInProgress.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
      } catch (error) {
        console.error("Error al inicializar autenticación:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Error al inicializar la autenticación.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        if (event === "SIGNED_OUT") {
          router.push("/sign-in");
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error de autenticación");
      }

      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("returnUrl");
      const redirectPath = returnUrl || "/dashboard";

      router.prefetch(redirectPath);

      try {
        await supabase.auth.refreshSession();
        toast({ title: "Éxito", description: "Has iniciado sesión correctamente." });
        router.push(redirectPath);
      } catch (err) {
        console.error("Error al refrescar sesión:", err);
        toast({
          title: "Error",
          description: "Error al actualizar la sesión.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      setProfile(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorType = typeof errorData.error === "string" ? errorData.error.toLowerCase() : "";

        if (errorType.includes("email") || errorType.includes("exists")) {
          if (errorType.includes("id") || errorType.includes("document")) {
            throw new Error("document_error");
          }
          throw new Error("email_error");
        } else if (errorType.includes("document") || errorType.includes("identity")) {
          throw new Error("document_error");
        } else if (errorType.includes("password")) {
          throw new Error("password_error");
        } else {
          throw new Error(errorData.error || "Error en el registro");
        }
      }

      const responseData = await response.json();
      toast({ title: "Éxito", description: "Cuenta creada exitosamente. Por favor inicia sesión." });
      router.push("/sign-in?registered=true");
      return responseData;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        let errorData = { error: "Error al cerrar sesión", details: "" };
        try { errorData = await response.json(); } catch (_) {}
        toast({
          title: "Error",
          description: `${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`,
          variant: "destructive",
        });
        throw new Error(errorData.error);
      }

      setUser(null);
      setSession(null);
      setProfile(null);
      toast({ title: "Éxito", description: "Has cerrado sesión correctamente." });
      router.push("/sign-in");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      if (!(error instanceof Error && error.message.includes("Error al cerrar sesión"))) {
        toast({
          title: "Error",
          description: "Ocurrió un error inesperado al cerrar sesión.",
          variant: "destructive",
        });
      }
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);