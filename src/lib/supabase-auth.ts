import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Client-side Supabase client (to be used in client components)
export const createClient = () => {
  return createClientComponentClient();
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
export const signInWithSocial = async (
  provider: "google" | "facebook"
) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(`Error signing in with ${provider}:`, error.message);
    throw error;
  }

  return data;
};
