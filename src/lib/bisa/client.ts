import 'server-only'

import { prisma } from "@/lib/prisma";

// Configuration
const BISA_API_URL = process.env.BISA_API_URL || "https://dev-sip.mc4.com.bo:8443";
const BISA_API_KEY = process.env.BISA_API_KEY || "";
const BISA_API_KEY_SERVICIO = process.env.BISA_API_KEY_SERVICIO || "";
const BISA_USERNAME = process.env.BISA_USERNAME || "";
const BISA_PASSWORD = process.env.BISA_PASSWORD || "";

// Types
export interface GenerateQRParams {
  alias: string;
  amount: number;
  currency: string;
  description: string;
  expirationDate: string; // dd/MM/yyyy
  singleUse?: boolean;
}

export interface GenerateQRResponse {
  success: boolean;
  data?: {
    qrImage: string;
    qrId: string;
    alias: string;
    expiresAt: string;
  };
  error?: string;
}

export interface TransactionStatusResponse {
  success: boolean;
  data?: {
    status: 'PENDIENTE' | 'PAGADO' | 'INHABILITADO' | 'ERROR' | 'EXPIRADO';
    processedAt?: string;
    payerName?: string;
    payerAccount?: string;
    payerDocument?: string;
    transactionId?: string;
  };
  error?: string;
}

export class BisaClient {
  /**
   * Get a valid authentication token, either from cache or by requesting a new one
   */
  async getToken(): Promise<string> {
    // 1. Check if we have a valid token in the database
    const validToken = await prisma.bisaToken.findFirst({
      where: {
        expiresAt: {
          gt: new Date(Date.now() + 5 * 60 * 1000), // Valid for at least 5 more minutes
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (validToken) {
      return validToken.token;
    }

    // 2. Request a new token
    return this.requestNewToken();
  }

  /**
   * Request a new authentication token from the BISA API
   */
  private async requestNewToken(): Promise<string> {
    try {
      const response = await fetch(`${BISA_API_URL}/autenticacion/v1/generarToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: BISA_API_KEY,
        },
        body: JSON.stringify({
          username: BISA_USERNAME,
          password: BISA_PASSWORD,
        }),
      });

      const data = await response.json();
      console.log("BISA token response:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error("BISA token request failed:", response.status, data);
        throw new Error(`Failed to get token: ${response.status} - ${data.mensaje || 'Unknown error'}`);
      }

      // Check for BISA error response format
      if (data.codigo === "NOK" || !data.objeto?.token) {
        console.error("BISA returned error:", data);
        throw new Error(`BISA API Error: ${data.mensaje || 'No token received'}`);
      }

      // Calculate expiration (usually 1 hour, but let's be safe with 55 minutes)
      const expiresAt = new Date(Date.now() + 55 * 60 * 1000);

      // Store in database
      await prisma.bisaToken.create({
        data: {
          token: data.objeto.token,
          expiresAt,
        },
      });

      return data.objeto.token;
    } catch (error) {
      console.error("Error requesting BISA token:", error);
      throw error;
    }
  }

  /**
   * Generate a QR code for payment
   */
  async generateQR(params: GenerateQRParams): Promise<GenerateQRResponse> {
    try {
      const token = await this.getToken();

      const payload = {
        alias: params.alias,
        callback: "000",
        detalleGlosa: params.description,
        monto: params.amount.toFixed(1), // Postman uses "2.0" format (1 decimal)
        moneda: params.currency,
        fechaVencimiento: params.expirationDate,
        tipoSolicitud: "API",
      };

      const response = await fetch(`${BISA_API_URL}/api/v1/generaQr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikeyServicio: BISA_API_KEY_SERVICIO,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("BISA generateQR response:", JSON.stringify(data, null, 2));

      if (response.status === 401) {
        // Token might be expired, retry once with new token
        await this.requestNewToken();
        return this.generateQR(params);
      }

      if (!response.ok || data.codigo === "9999") {
        console.error("BISA generateQR error:", data);
        return {
          success: false,
          error: data.mensaje || `API Error: ${response.status}`,
        };
      }

      if (data.codigo !== "0000") {
        return {
          success: false,
          error: data.mensaje || "Error generating QR",
        };
      }

      // BISA API returns data nested inside "objeto"
      const objeto = data.objeto;

      return {
        success: true,
        data: {
          qrImage: objeto?.imagenQr,
          qrId: objeto?.idQr,
          alias: params.alias,
          expiresAt: objeto?.fechaVencimiento,
        },
      };
    } catch (error) {
      console.error("Error generating QR:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check the status of a transaction
   */
  async checkStatus(alias: string): Promise<TransactionStatusResponse> {
    try {
      const token = await this.getToken();

      const response = await fetch(`${BISA_API_URL}/api/v1/estadoTransaccion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikeyServicio: BISA_API_KEY_SERVICIO,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alias: alias,
        }),
      });

      if (response.status === 401) {
        await this.requestNewToken();
        return this.checkStatus(alias);
      }

      if (!response.ok) {
        return {
          success: false,
          error: `API Error: ${response.status}`,
        };
      }

      const data = await response.json();
      console.log("BISA checkStatus response:", JSON.stringify(data, null, 2));

      if (data.codigo !== "0000") {
        return {
          success: false,
          error: data.mensaje,
        };
      }

      // BISA API returns data nested inside "objeto"
      // Status field is "estadoActual" not "estado"
      const objeto = data.objeto;

      return {
        success: true,
        data: {
          status: objeto?.estadoActual,
          processedAt: objeto?.fechaProcesamiento,
          payerName: objeto?.nombreCliente,
          payerAccount: objeto?.cuentaCliente,
          payerDocument: objeto?.documentoCliente,
          transactionId: objeto?.numeroOrdenOriginante,
        },
      };
    } catch (error) {
      console.error("Error checking status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Disable a QR code
   */
  async disableQR(alias: string): Promise<boolean> {
    try {
      const token = await this.getToken();

      const response = await fetch(`${BISA_API_URL}/api/v1/inhabilitarPago`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikeyServicio: BISA_API_KEY_SERVICIO,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alias: alias,
        }),
      });

      if (response.status === 401) {
        await this.requestNewToken();
        return this.disableQR(alias);
      }

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.codigo === "0000";
    } catch (error) {
      console.error("Error disabling QR:", error);
      return false;
    }
  }
}

export const bisaClient = new BisaClient();
