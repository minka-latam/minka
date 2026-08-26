import type { CARD_PAYMENT_CURRENCIES } from "@/lib/payments/provider-validation";

export type TransoftPaymentCurrency = (typeof CARD_PAYMENT_CURRENCIES)[number];

export type TransoftCheckoutLanguage = "esp" | "eng";

export type TransoftCreateSessionInput = {
  code: string;
  amount: number;
  currency: TransoftPaymentCurrency;
  language?: TransoftCheckoutLanguage;
  descripcion?: string;
  redirect?: boolean;
  urlToRedirect?: string;
};

export type TransoftPaymentSession = {
  token: string;
  url: string;
  expiresInSeconds: number;
};

export type TransoftPaymentRecord = {
  bookCode: string;
  amount: string;
  currency: string;
  description?: string;
  status: string;
  creationDate?: string;
  paymentDate?: string | null;
};

export type TransoftSearchInput =
  | { bookCode: string; fromDate?: never; toDate?: never }
  | { bookCode?: never; fromDate: string; toDate: string };

export type TransoftSearchResult = {
  count: number;
  payments: TransoftPaymentRecord[];
};

export type TransoftPaymentNotification = {
  bookCode: string;
  status: string;
  paymentDate: string;
  amount: string | number;
  currency: string;
};
