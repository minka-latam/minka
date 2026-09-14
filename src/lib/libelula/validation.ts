import { z } from 'zod';
import { validateProviderPayment } from '@/lib/payments/provider-validation';
import type { LibelulaDebt } from './client';

const amount = z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)])
  .transform(Number).pipe(z.number().finite().min(0).max(50000))
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001, 'Use at most two decimal places');
export const cardInputSchema = z.object({
  campaignId: z.string().uuid(), amount: amount.refine(value => value >= 1), tipAmount: amount.default(0),
  currency: z.literal('BOB').default('BOB'), paymentEmail: z.string().trim().email().max(254),
  idempotencyKey: z.string().uuid(), clientAuthState: z.enum(['authenticated', 'anonymous']).default('anonymous'),
  isAnonymous: z.boolean().default(false), notificationEnabled: z.boolean().default(false),
  message: z.string().max(2000).default(''), customAmount: z.boolean().default(false),
});
export function validateDebt(donation: { id: string; paymentProvider: string | null; providerReference: string | null; providerTotalAmount: unknown; providerCurrency: string | null }, debt: LibelulaDebt) {
  if (donation.paymentProvider !== 'libelula' || debt.identificador !== donation.providerReference || debt.identificador !== donation.id) return false;
  return validateProviderPayment({
    expectedAmount: Number(donation.providerTotalAmount), providerAmount: debt.valor_total,
    expectedCurrency: donation.providerCurrency || '', providerCurrency: debt.moneda, amountTolerance: 0,
  }).ok;
}
