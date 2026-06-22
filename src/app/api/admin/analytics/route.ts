import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const PERIODS = {
  week: {
    key: "week",
    label: "Últimos 7 días",
    days: 7,
    granularity: "day",
  },
  month: {
    key: "month",
    label: "Últimos 30 días",
    days: 30,
    granularity: "day",
  },
  year: {
    key: "year",
    label: "Últimos 12 meses",
    days: 365,
    granularity: "month",
  },
} as const;

type PeriodKey = keyof typeof PERIODS;
type Granularity = (typeof PERIODS)[PeriodKey]["granularity"];
type Bucket = {
  key: string;
  name: string;
  amount: number;
  donations: number;
  newUsers: number;
  comments: number;
  savedCampaigns: number;
  campaignUpdates: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const campaignCategoryLabels: Record<string, string> = {
  cultura_arte: "Cultura y arte",
  educacion: "Educación",
  emergencia: "Emergencia",
  igualdad: "Igualdad",
  medioambiente: "Medio ambiente",
  salud: "Salud",
  otros: "Otros",
};

const campaignStatusLabels: Record<string, string> = {
  draft: "Borrador",
  active: "Activa",
  completed: "Finalizada",
  cancelled: "Cancelada",
};

const paymentMethodLabels: Record<string, string> = {
  credit_card: "Tarjeta",
  qr: "QR",
  bank_transfer: "Transferencia",
};

const userSegmentLabels: Record<string, string> = {
  "admin-active": "Administradores activos",
  "admin-inactive": "Administradores inactivos",
  "user-active": "Usuarios activos",
  "user-inactive": "Usuarios inactivos",
};

const verificationStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

function parsePeriod(value: string | null): PeriodKey {
  return value === "week" || value === "year" ? value : "month";
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getPeriodBounds(period: PeriodKey, now = new Date()) {
  if (period === "year") {
    const currentStart = startOfMonth(addMonths(now, -11));
    const previousStart = addMonths(currentStart, -12);

    return {
      currentStart,
      currentEnd: now,
      previousStart,
      previousEnd: currentStart,
    };
  }

  const days = PERIODS[period].days;
  const currentStart = startOfDay(addDays(now, -(days - 1)));

  return {
    currentStart,
    currentEnd: now,
    previousStart: addDays(currentStart, -days),
    previousEnd: currentStart,
  };
}

function getBucketKey(date: Date, granularity: Granularity) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (granularity === "month") {
    return `${year}-${month}`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBucketLabel(date: Date, granularity: Granularity) {
  return new Intl.DateTimeFormat("es-BO", {
    day: granularity === "day" ? "2-digit" : undefined,
    month: "short",
    year: granularity === "month" ? "2-digit" : undefined,
  }).format(date);
}

function createBuckets(start: Date, end: Date, granularity: Granularity) {
  const buckets: Bucket[] = [];
  const byKey = new Map<string, Bucket>();
  let cursor = granularity === "month" ? startOfMonth(start) : startOfDay(start);

  while (cursor <= end) {
    const key = getBucketKey(cursor, granularity);
    const bucket = {
      key,
      name: getBucketLabel(cursor, granularity),
      amount: 0,
      donations: 0,
      newUsers: 0,
      comments: 0,
      savedCampaigns: 0,
      campaignUpdates: 0,
    };

    buckets.push(bucket);
    byKey.set(key, bucket);
    cursor =
      granularity === "month" ? addMonths(cursor, 1) : addDays(cursor, 1);
  }

  return { buckets, byKey };
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);

  const maybeDecimal = value as { toNumber?: () => number };
  if (typeof maybeDecimal.toNumber === "function") {
    return maybeDecimal.toNumber();
  }

  return Number(value);
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function calculateGrowthRate(current: number, previous: number) {
  if (previous <= 0) return null;
  return round(((current - previous) / previous) * 100, 1);
}

function incrementBucket(
  byKey: Map<string, Bucket>,
  createdAt: Date,
  granularity: Granularity,
  update: (bucket: Bucket) => void
) {
  const bucket = byKey.get(getBucketKey(createdAt, granularity));
  if (bucket) update(bucket);
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const period = parsePeriod(request.nextUrl.searchParams.get("period"));
    const periodConfig = PERIODS[period];
    const { currentStart, currentEnd, previousStart, previousEnd } =
      getPeriodBounds(period);
    const granularity = periodConfig.granularity;
    const periodWhere = {
      createdAt: {
        gte: currentStart,
        lt: currentEnd,
      },
    };
    const previousPeriodWhere = {
      createdAt: {
        gte: previousStart,
        lt: previousEnd,
      },
    };

    const [
      totalUsers,
      activeUsers,
      totalCampaigns,
      activeCampaigns,
      totalCompletedDonationAggregate,
      periodCompletedDonationAggregate,
      previousCompletedDonationAggregate,
      periodNewUsers,
      periodNewCampaigns,
      pendingVerifications,
      periodNotifications,
      totalNotifications,
      periodComments,
      periodSavedCampaigns,
      periodCampaignUpdates,
      categoryGroups,
      campaignStatusGroups,
      verificationStatusGroups,
      donationMethodGroups,
      userSegmentGroups,
      donationRows,
      userRows,
      commentRows,
      savedCampaignRows,
      campaignUpdateRows,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { status: "active" } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { campaignStatus: "active" } }),
      prisma.donation.aggregate({
        where: { paymentStatus: "completed" },
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),
      prisma.donation.aggregate({
        where: { paymentStatus: "completed", ...periodWhere },
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),
      prisma.donation.aggregate({
        where: { paymentStatus: "completed", ...previousPeriodWhere },
        _sum: { amount: true },
      }),
      prisma.profile.count({ where: periodWhere }),
      prisma.campaign.count({ where: periodWhere }),
      prisma.campaignVerification.count({
        where: { status: "active", verificationStatus: "pending" },
      }),
      prisma.notification.count({ where: { status: "active", ...periodWhere } }),
      prisma.notification.count({ where: { status: "active" } }),
      prisma.comment.count({ where: { status: "active", ...periodWhere } }),
      prisma.savedCampaign.count({
        where: { status: "active", ...periodWhere },
      }),
      prisma.campaignUpdate.count({
        where: { status: "active", ...periodWhere },
      }),
      prisma.campaign.groupBy({
        by: ["category"],
        where: periodWhere,
        _count: { _all: true },
      }),
      prisma.campaign.groupBy({
        by: ["campaignStatus"],
        _count: { _all: true },
      }),
      prisma.campaignVerification.groupBy({
        by: ["verificationStatus"],
        where: { status: "active" },
        _count: { _all: true },
      }),
      prisma.donation.groupBy({
        by: ["paymentMethod"],
        where: { paymentStatus: "completed", ...periodWhere },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.profile.groupBy({
        by: ["role", "status"],
        _count: { _all: true },
      }),
      prisma.donation.findMany({
        where: { paymentStatus: "completed", ...periodWhere },
        select: { createdAt: true, amount: true },
      }),
      prisma.profile.findMany({
        where: periodWhere,
        select: { createdAt: true },
      }),
      prisma.comment.findMany({
        where: { status: "active", ...periodWhere },
        select: { createdAt: true },
      }),
      prisma.savedCampaign.findMany({
        where: { status: "active", ...periodWhere },
        select: { createdAt: true },
      }),
      prisma.campaignUpdate.findMany({
        where: { status: "active", ...periodWhere },
        select: { createdAt: true },
      }),
    ]);

    const { buckets, byKey } = createBuckets(
      currentStart,
      currentEnd,
      granularity
    );

    donationRows.forEach((donation) => {
      incrementBucket(byKey, donation.createdAt, granularity, (bucket) => {
        bucket.amount += toNumber(donation.amount);
        bucket.donations += 1;
      });
    });

    userRows.forEach((row) => {
      incrementBucket(byKey, row.createdAt, granularity, (bucket) => {
        bucket.newUsers += 1;
      });
    });

    commentRows.forEach((row) => {
      incrementBucket(byKey, row.createdAt, granularity, (bucket) => {
        bucket.comments += 1;
      });
    });

    savedCampaignRows.forEach((row) => {
      incrementBucket(byKey, row.createdAt, granularity, (bucket) => {
        bucket.savedCampaigns += 1;
      });
    });

    campaignUpdateRows.forEach((row) => {
      incrementBucket(byKey, row.createdAt, granularity, (bucket) => {
        bucket.campaignUpdates += 1;
      });
    });

    const periodCompletedDonationAmount = toNumber(
      periodCompletedDonationAggregate._sum.amount
    );
    const previousCompletedDonationAmount = toNumber(
      previousCompletedDonationAggregate._sum.amount
    );
    const totalCompletedDonationAmount = toNumber(
      totalCompletedDonationAggregate._sum.amount
    );
    const periodInteractionCount =
      periodComments + periodSavedCampaigns + periodCampaignUpdates;

    return NextResponse.json(
      {
        period: {
          key: periodConfig.key,
          label: periodConfig.label,
          currentStart: currentStart.toISOString(),
          currentEnd: currentEnd.toISOString(),
          previousStart: previousStart.toISOString(),
          previousEnd: previousEnd.toISOString(),
        },
        overview: {
          totalUsers,
          activeUsers,
          newUsers: periodNewUsers,
          totalCampaigns,
          activeCampaigns,
          newCampaigns: periodNewCampaigns,
          completedDonationAmount: round(periodCompletedDonationAmount),
          completedDonationCount:
            periodCompletedDonationAggregate._count._all,
          totalCompletedDonationAmount: round(totalCompletedDonationAmount),
          totalCompletedDonationCount:
            totalCompletedDonationAggregate._count._all,
          averageDonationAmount: round(
            toNumber(periodCompletedDonationAggregate._avg.amount)
          ),
          pendingVerifications,
          periodInteractions: periodInteractionCount,
          interactionBreakdown: {
            comments: periodComments,
            savedCampaigns: periodSavedCampaigns,
            campaignUpdates: periodCampaignUpdates,
          },
          donationGrowthRate: calculateGrowthRate(
            periodCompletedDonationAmount,
            previousCompletedDonationAmount
          ),
          previousCompletedDonationAmount: round(
            previousCompletedDonationAmount
          ),
          periodNotifications,
          totalNotifications,
        },
        charts: {
          donationTrend: buckets.map((bucket) => ({
            name: bucket.name,
            amount: round(bucket.amount),
            donations: bucket.donations,
          })),
          userTrend: buckets.map((bucket) => ({
            name: bucket.name,
            newUsers: bucket.newUsers,
          })),
          activityTrend: buckets.map((bucket) => ({
            name: bucket.name,
            comments: bucket.comments,
            savedCampaigns: bucket.savedCampaigns,
            campaignUpdates: bucket.campaignUpdates,
            total:
              bucket.comments + bucket.savedCampaigns + bucket.campaignUpdates,
          })),
          campaignCategories: categoryGroups
            .map((row) => ({
              name: campaignCategoryLabels[row.category] ?? row.category,
              value: row._count._all,
            }))
            .sort((a, b) => b.value - a.value),
          campaignStatuses: campaignStatusGroups
            .map((row) => ({
              name:
                campaignStatusLabels[row.campaignStatus] ??
                row.campaignStatus,
              value: row._count._all,
            }))
            .sort((a, b) => b.value - a.value),
          verificationStatuses: verificationStatusGroups
            .map((row) => ({
              name:
                verificationStatusLabels[row.verificationStatus] ??
                row.verificationStatus,
              value: row._count._all,
            }))
            .sort((a, b) => b.value - a.value),
          donationMethods: donationMethodGroups
            .map((row) => ({
              name: paymentMethodLabels[row.paymentMethod] ?? row.paymentMethod,
              value: row._count._all,
              amount: round(toNumber(row._sum.amount)),
            }))
            .sort((a, b) => b.value - a.value),
          userSegments: userSegmentGroups
            .map((row) => {
              const key = `${row.role}-${row.status}`;
              return {
                name: userSegmentLabels[key] ?? key,
                value: row._count._all,
              };
            })
            .sort((a, b) => b.value - a.value),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in admin analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
