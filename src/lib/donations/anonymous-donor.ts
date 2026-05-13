import { Prisma, Status, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const CAMPAIGN_ANONYMOUS_EMAIL_PREFIX = "anonymous+campaign-";
export const ANONYMOUS_DONOR_NAME = "Donante Anónimo";

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export function getCampaignAnonymousProfileEmail(campaignId: string) {
  return `${CAMPAIGN_ANONYMOUS_EMAIL_PREFIX}${campaignId}@minka.org`;
}

export function getCampaignAnonymousIdentityNumber(campaignId: string) {
  return `ANON-CAMPAIGN-${campaignId}`;
}

export function technicalAnonymousProfileExclusion() {
  return {
    NOT: [{ email: { startsWith: CAMPAIGN_ANONYMOUS_EMAIL_PREFIX } }],
  } satisfies Prisma.ProfileWhereInput;
}

export async function getOrCreateCampaignAnonymousProfile(
  campaignId: string,
  client: PrismaClientLike = prisma,
) {
  const email = getCampaignAnonymousProfileEmail(campaignId);

  return client.profile.upsert({
    where: { email },
    create: {
      email,
      identityNumber: getCampaignAnonymousIdentityNumber(campaignId),
      name: ANONYMOUS_DONOR_NAME,
      passwordHash: "not-applicable",
      phone: "0000000000",
      birthDate: new Date("1900-01-01T00:00:00.000Z"),
      role: UserRole.user,
      status: Status.inactive,
    },
    update: {
      identityNumber: getCampaignAnonymousIdentityNumber(campaignId),
      name: ANONYMOUS_DONOR_NAME,
      passwordHash: "not-applicable",
      phone: "0000000000",
      birthDate: new Date("1900-01-01T00:00:00.000Z"),
      role: UserRole.user,
      status: Status.inactive,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

export async function getOrCreateCampaignAnonymousProfileId(
  campaignId: string,
  client: PrismaClientLike = prisma,
) {
  const profile = await getOrCreateCampaignAnonymousProfile(campaignId, client);
  return profile.id;
}
