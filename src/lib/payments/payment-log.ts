import { PaymentMethod, PaymentProvider, Prisma } from "@prisma/client";

type CompletedPaymentLogInput = {
  paymentprovider: PaymentProvider;
  paymentmethod: PaymentMethod;
  paymentid: string;
  amount: number;
  tipamount?: number | null;
  currency: string;
  metadata?: string | null;
  campaignid?: string | null;
  donorid?: string | null;
};

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createCompletedPaymentLogIfMissing(
  tx: Prisma.TransactionClient,
  data: CompletedPaymentLogInput,
) {
  const existing = await tx.paymentLog.findFirst({
    where: {
      paymentprovider: data.paymentprovider,
      paymentid: data.paymentid,
      status: "completed",
    },
    select: { id: true },
  });

  if (existing) return false;

  try {
    await tx.paymentLog.create({
      data: {
        ...data,
        status: "completed",
      },
    });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) return false;
    throw error;
  }
}
