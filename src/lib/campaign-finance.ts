export const PLATFORM_FEE_RATE = 0.05
// TEMPORARY: lowered for transfer-request testing. Restore to 100 afterwards.
export const MIN_TRANSFER_AMOUNT = 0.01

export function toNumber(value: unknown) {
  if (value == null) return 0
  return Number(value) || 0
}

export function formatCurrency(amount?: number | null) {
  return `Bs. ${(amount || 0).toLocaleString('es-BO', {
    maximumFractionDigits: 2,
  })}`
}

export function calculatePlatformFee(baseAmount: number) {
  return baseAmount * PLATFORM_FEE_RATE
}

export function calculateCampaignFinancials({
  collectedAmount,
  tipAmount,
}: {
  collectedAmount: unknown
  tipAmount: unknown
}) {
  const campaignCollectedAmount = toNumber(collectedAmount)
  const campaignTipAmount = toNumber(tipAmount)

  return {
    tipAmount: campaignTipAmount,
    platformFeeAmount: calculatePlatformFee(
      campaignCollectedAmount,
    ),
    totalProcessedAmount:
      campaignCollectedAmount + campaignTipAmount,
  }
}
