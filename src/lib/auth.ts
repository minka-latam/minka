import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type Session } from "@supabase/supabase-js";
import { cache } from "react";

export const getAuthSession = cache(async (): Promise<Session | null> => {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return cookieStore.get(name)?.value;
          },
          async set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Can't set cookies during SSR
              console.error("Error setting cookie:", error);
            }
          },
          async remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // Can't remove cookies during SSR
              console.error("Error removing cookie:", error);
            }
          },
        },
      }
    );

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error in getAuthSession:", error);
    return null;
  }
});

export const requireAuth = async () => {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  return session;
};

export const requireUnauth = async () => {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }
};

export const getCurrentUser = async () => {
  const session = await getAuthSession();

  if (!session?.user) {
    return null;
  }

  return session.user;
};
