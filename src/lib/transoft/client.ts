import type {
  TransoftCreateSessionInput,
  TransoftPaymentRecord,
  TransoftPaymentSession,
  TransoftSearchInput,
  TransoftSearchResult,
} from "@/lib/transoft/types";

type TransoftClientConfig = {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
};

type TransoftSessionResponse = {
  token?: unknown;
  url?: unknown;
  expires_in?: unknown;
};

type TransoftSearchResponse = {
  success?: unknown;
  count?: unknown;
  payments?: unknown;
  data?: unknown;
};

export class TransoftConfigurationError extends Error {}

export class TransoftResponseError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly providerMessage?: string,
  ) {
    super(message);
  }
}

function requiredConfig(name: string, value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new TransoftConfigurationError(`${name} is not configured`);
  }
  return normalized;
}

function normalizeBaseUrl(value: string) {
  const url = new URL(value);
  return url.toString().replace(/\/$/, "");
}

export function loadTransoftConfig(): TransoftClientConfig {
  const configuredBaseUrl =
    process.env.TRANSOFT_BASE_URL ||
    process.env.TRANSOFT_SESSION_URL?.replace(/\/session\/?$/, "");

  return {
    baseUrl: normalizeBaseUrl(
      requiredConfig("TRANSOFT_BASE_URL", configuredBaseUrl),
    ),
    apiKey: requiredConfig("TRANSOFT_API_KEY", process.env.TRANSOFT_API_KEY),
    timeoutMs: Number(process.env.TRANSOFT_TIMEOUT_MS) || 10_000,
  };
}

function isPaymentRecord(value: unknown): value is TransoftPaymentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.bookCode === "string" &&
    (typeof record.amount === "string" || typeof record.amount === "number") &&
    typeof record.currency === "string" &&
    typeof record.status === "string"
  );
}

export function parseTransoftSessionResponse(
  data: TransoftSessionResponse,
): TransoftPaymentSession {
  const token = typeof data.token === "string" ? data.token.trim() : "";
  const url = typeof data.url === "string" ? data.url.trim() : "";
  const expiresInSeconds = Number(data.expires_in);

  if (
    !token ||
    !url ||
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds <= 0
  ) {
    throw new TransoftResponseError(
      "Transoft returned an invalid payment session",
    );
  }

  try {
    new URL(url);
  } catch {
    throw new TransoftResponseError(
      "Transoft returned an invalid checkout URL",
    );
  }

  return { token, url, expiresInSeconds };
}

export function parseTransoftSearchResponse(
  data: TransoftSearchResponse,
): TransoftSearchResult {
  const rawPayments = Array.isArray(data.payments)
    ? data.payments
    : Array.isArray(data.data)
      ? data.data
      : [];
  const payments = rawPayments.filter(isPaymentRecord).map((payment) => ({
    ...payment,
    amount: String(payment.amount),
  }));

  if (data.success !== true) {
    throw new TransoftResponseError(
      "Transoft returned an unsuccessful search response",
    );
  }

  return {
    count: Number.isFinite(Number(data.count))
      ? Number(data.count)
      : payments.length,
    payments,
  };
}

export class TransoftClient {
  private readonly timeoutMs: number;

  constructor(private readonly config: TransoftClientConfig) {
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  static fromEnvironment() {
    return new TransoftClient(loadTransoftConfig());
  }

  private async post(path: string, payload: unknown) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (!response.ok || !data) {
        const providerMessage =
          typeof data?.message === "string"
            ? data.message
            : typeof data?.error === "string"
              ? data.error
              : undefined;
        throw new TransoftResponseError(
          `Transoft request failed with status ${response.status}`,
          response.status,
          providerMessage,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof TransoftResponseError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new TransoftResponseError("Transoft request timed out");
      }
      throw new TransoftResponseError("Transoft is unavailable");
    } finally {
      clearTimeout(timeout);
    }
  }

  async createPaymentSession(
    input: TransoftCreateSessionInput,
  ): Promise<TransoftPaymentSession> {
    if (input.redirect && !input.urlToRedirect) {
      throw new TransoftConfigurationError(
        "urlToRedirect is required when redirect is enabled",
      );
    }

    const data = await this.post("/session", input);
    return parseTransoftSessionResponse(data);
  }

  async searchPayments(
    input: TransoftSearchInput,
  ): Promise<TransoftSearchResult> {
    const payload =
      "bookCode" in input
        ? {
            from_date: "",
            to_date: "",
            bookCode: input.bookCode,
          }
        : {
            from_date: input.fromDate,
            to_date: input.toDate,
            bookCode: "",
          };
    const data = await this.post("/search", payload);
    return parseTransoftSearchResponse(data);
  }
}

export const transoftClient = {
  createPaymentSession(input: TransoftCreateSessionInput) {
    return TransoftClient.fromEnvironment().createPaymentSession(input);
  },
  searchPayments(input: TransoftSearchInput) {
    return TransoftClient.fromEnvironment().searchPayments(input);
  },
};
