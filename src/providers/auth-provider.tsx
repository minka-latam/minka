"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User, Session } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

// Explicitly define Profile type to match ProfileData structure used in the app
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
  const [profileFetchInProgress, setProfileFetchInProgress] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Optimized profile fetch with timeout and retry logic
  const fetchProfile = async (userId: string, retryCount = 0) => {
    // Skip if a fetch is already in progress for the same user
    if (profileFetchInProgress) {
      console.log("Profile fetch already in progress, skipping redundant call");
      return null;
    }

    try {
      setProfileFetchInProgress(true);
      console.log(
        `Fetching profile for user: ${userId} (attempt ${retryCount + 1})`
      );

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () =>
          controller.abort(
            new DOMException("Profile fetch timed out after 10s", "AbortError")
          ),
        10000
      ); // 10 second timeout

      const response = await fetch(`/api/profile/${userId}`, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Network error" }));
        console.error("Error fetching profile:", errorData);
        throw new Error(errorData.error || "Failed to fetch profile");
      }

      const data = await response.json();

      if (data.profile) {
        setProfile(data.profile);
        console.log("Profile fetched successfully:", data.profile);
        return data.profile;
      } else {
        throw new Error("No profile data received");
      }
    } catch (error) {
      const isRetryable =
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.includes("network") ||
          error.message.includes("fetch"));

      if (retryCount < 2 && isRetryable) {
        console.warn(
          `Error fetching profile (attempt ${retryCount + 1}):`,
          error instanceof Error ? error.message : error
        );
      } else {
        console.error(
          `Error fetching profile (attempt ${retryCount + 1}):`,
          error
        );
      }

      // Retry logic for network errors (max 2 retries)
      if (
        retryCount < 2 &&
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.includes("network") ||
          error.message.includes("fetch"))
      ) {
        console.log(
          `Retrying profile fetch in ${(retryCount + 1) * 1000}ms...`
        );
        setTimeout(
          () => fetchProfile(userId, retryCount + 1),
          (retryCount + 1) * 1000
        );
        return null;
      }

      // If all retries failed or it's not a retry-able error, set profile to null
      setProfile(null);

      // Only show toast for final failure
      if (
        retryCount >= 2 ||
        (error instanceof Error && !error.message.includes("AbortError"))
      ) {
        toast({
          title: "Error",
          description:
            "No se pudo cargar la información del perfil. Algunos datos pueden no estar disponibles.",
          variant: "destructive",
        });
      }

      return null;
    } finally {
      setProfileFetchInProgress(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Error initializing authentication.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      // Only update if the session actually changed to prevent redundant updates
      const currentUserId = session?.user?.id;
      const newUserId = newSession?.user?.id;

      if (currentUserId !== newUserId) {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }

      if (event === "SIGNED_OUT") {
        router.push("/sign-in");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Call our login API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      // Get the return URL if it exists
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("returnUrl");
      const redirectPath = returnUrl || "/dashboard";

      // Prefetch the dashboard page to make redirection faster
      router.prefetch(redirectPath);

      // Keep isLoading true to show the spinner during the session refresh
      // Don't navigate immediately, wait for the session to refresh first

      try {
        // Wait for session to refresh before navigation
        await supabase.auth.refreshSession();

        // Show success message
        toast({
          title: "Éxito",
          description: "Has iniciado sesión correctamente.",
        });

        // Navigate after session is refreshed
        router.push(redirectPath);
      } catch (err) {
        console.error("Session refresh error:", err);
        toast({
          title: "Error",
          description: "Error al actualizar la sesión.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setProfile(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      setIsLoading(true);

      // Call our custom registration endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); 
        console.error("Registration API error:", response.status, errorData);

        // Use a simplified error message instead of exposing details
        const errorType = typeof errorData.error === 'string' ? errorData.error.toLowerCase() : "";

        if (errorType.includes("email") || errorType.includes("exists")) {
          // If it mentions email or general existence, likely email or ID duplication
          if (errorType.includes("id") || errorType.includes("document")) {
             throw new Error("document_error");
          }
           throw new Error("email_error");
        } else if (
          errorType.includes("document") ||
          errorType.includes("identity")
        ) {
          throw new Error("document_error");
        } else if (errorType.includes("password")) {
          throw new Error("password_error");
        } else {
          // Pass the actual error message if available, otherwise generic
          throw new Error(errorData.error || "Registration failed");
        }
      }

      const responseData = await response.json();

      toast({
        title: "Éxito",
        description: "Cuenta creada exitosamente. Por favor inicia sesión.",
      });

      // Redirect to sign-in page after successful registration
      router.push("/sign-in?registered=true");
      return responseData;
    } catch (error) {
      console.error("Registration error:", error);
      // Let the form component handle detailed errors
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      console.log("Attempting sign out via API...");

      // Call the server-side logout endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Check if the API call itself failed (network error, etc.)
      if (!response.ok) {
        let errorData = { error: "Logout API call failed", details: "" };
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore error if response body is not JSON
        }
        console.error("Logout API error:", errorData);
        toast({
          title: "Error",
          description: `${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`,
          variant: "destructive",
        });
        // Throw an error to stop execution
        throw new Error(errorData.error || "Logout API call failed");
      }

      // API call was successful (status 2xx)
      // The server has initiated the sign-out and cleared the cookie.
      console.log("Logout API call successful.");

      // Clear state immediately after successful API call
      setUser(null);
      setSession(null);
      setProfile(null);

      // Show success toast
      toast({
        title: "Éxito",
        description: "Has cerrado sesión correctamente.",
      });

      // Immediately redirect to sign-in page
      router.push("/sign-in");
    } catch (error) {
      // Catch errors from the fetch call or the explicit throw above
      console.error("Sign out process error:", error);
      // Avoid showing a generic toast if a specific one was already shown
      if (!(error instanceof Error && error.message.includes("Logout API"))) {
        toast({
          title: "Error",
          description: "An unexpected error occurred during sign out.",
          variant: "destructive",
        });
      }

      // Even if there's an error, make sure we clear the state
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
