// Common types used throughout the application

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  created_at: string;
  identity_number?: string | null;
  identityNumber?: string | null;
  birth_date?: string | null;
  birthDate?: string | null;
  profile_picture?: string | null;
  profilePicture?: string | null;
  [key: string]: string | boolean | number | null | undefined;
}

export interface Campaign {
  id: string;
  title?: string;
  description?: string;
  goal_amount?: number;
  current_amount?: number;
  location?: string;
  image_url?: string;
  category_id?: string;
  youtube_url?: string;
  presentation?: string;
  end_date?: string;
  organizer_id?: string;
  categories?: {
    name: string;
  };
  donor_count?: number;
  days_remaining?: number;
  [key: string]: any; // For any additional properties that may exist
}
