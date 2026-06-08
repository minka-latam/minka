import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client (to be used in client components)
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Function to sign out
export const signOut = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error.message);
    throw error;
  }

  return true;
};

// Function to handle social login
export const signInWithSocial = async (provider: "google") => {
  const supabase = createClient();
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    window.location.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${appOrigin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    console.error(`Error signing in with ${provider}:`, error.message);
    throw error;
  }

  return data;
};
