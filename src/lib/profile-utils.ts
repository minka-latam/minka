import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  profilePicture: string | null;
  identityNumber: string | null;
  birthDate: Date | null;
  bio: string | null;
  location: string | null;
  verificationStatus: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  activeCampaignsCount?: number;
};

export function profileNeedsCompletion(profile: {
  phone: string | null;
  identityNumber: string | null;
  birthDate: Date | string | null;
  location: string | null;
}) {
  return (
    !profile.phone ||
    !profile.identityNumber ||
    !profile.birthDate ||
    !profile.location
  );
}

export function formatProfileForApi(profile: ProfileRow) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    profile_picture: profile.profilePicture,
    identity_number: profile.identityNumber,
    birth_date: profile.birthDate?.toISOString() || null,
    bio: profile.bio,
    location: profile.location,
    verification_status: profile.verificationStatus,
    status: profile.status,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
    active_campaigns_count: profile.activeCampaignsCount ?? 0,
  };
}

export function formatAdminProfileForApi(profile: ProfileRow) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    profile_picture: profile.profilePicture,
    verification_status: profile.verificationStatus,
    status: profile.status,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
    active_campaigns_count: profile.activeCampaignsCount ?? 0,
  };
}

function metadataString(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function profileNameFromUser(user: User) {
  const metadata = (user.user_metadata as Record<string, unknown> | null) ?? {};
  const fullName = metadataString(metadata, ["full_name", "name"]);

  if (fullName) return fullName;

  const firstName = metadataString(metadata, ["first_name", "given_name"]);
  const lastName = metadataString(metadata, ["last_name", "family_name"]);
  const combinedName = `${firstName ?? ""} ${lastName ?? ""}`.trim();

  return combinedName || user.email?.split("@")[0] || "Usuario";
}

export async function getProfileById(userId: string) {
  const [profile] = await prisma.$queryRaw<ProfileRow[]>`
    select
      id::text,
      name,
      email,
      phone,
      role::text,
      profile_picture as "profilePicture",
      identity_number as "identityNumber",
      birth_date as "birthDate",
      bio,
      location,
      verification_status as "verificationStatus",
      status::text,
      created_at as "createdAt",
      updated_at as "updatedAt",
      active_campaigns_count as "activeCampaignsCount"
    from public.profiles
    where id = ${userId}::uuid
    limit 1
  `;

  return profile ?? null;
}

export async function ensureProfileForUser(user: User) {
  const metadata = (user.user_metadata as Record<string, unknown> | null) ?? {};
  const name = profileNameFromUser(user);
  const email = user.email || metadataString(metadata, ["email"]) || "";
  const profilePicture = metadataString(metadata, ["avatar_url", "picture"]);

  const [profile] = await prisma.$queryRaw<ProfileRow[]>`
    insert into public.profiles (
      id,
      name,
      email,
      password_hash,
      profile_picture,
      identity_number,
      phone,
      birth_date,
      bio,
      location,
      join_date,
      status,
      verification_status,
      updated_at
    )
    values (
      ${user.id}::uuid,
      ${name},
      ${email},
      '',
      ${profilePicture},
      null,
      null,
      null,
      null,
      null,
      current_timestamp,
      'active'::"Status",
      false,
      current_timestamp
    )
    on conflict (id) do update set
      name = case
        when public.profiles.name is null
          or public.profiles.name = ''
          or public.profiles.name = 'Usuario'
          then excluded.name
        else public.profiles.name
      end,
      email = coalesce(nullif(excluded.email, ''), public.profiles.email),
      profile_picture = coalesce(public.profiles.profile_picture, excluded.profile_picture),
      identity_number = case
        when public.profiles.identity_number = 'pending' then null
        when public.profiles.identity_number like 'oauth_%' then null
        else public.profiles.identity_number
      end,
      phone = case
        when public.profiles.phone = 'pending' then null
        else public.profiles.phone
      end,
      birth_date = case
        when public.profiles.birth_date = date '1900-01-01' then null
        else public.profiles.birth_date
      end,
      updated_at = current_timestamp
    returning
      id::text,
      name,
      email,
      phone,
      role::text,
      profile_picture as "profilePicture",
      identity_number as "identityNumber",
      birth_date as "birthDate",
      bio,
      location,
      verification_status as "verificationStatus",
      status::text,
      created_at as "createdAt",
      updated_at as "updatedAt",
      active_campaigns_count as "activeCampaignsCount"
  `;

  if (!profile) {
    throw new Error("Profile setup failed");
  }

  return profile;
}
