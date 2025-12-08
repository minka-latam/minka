# BISA QR Payment Integration Specification

## Overview

This document specifies the implementation of Bolivian QR payments (BISA/SIP) for the MINKA donation platform. The integration enables users to donate using QR codes scanned with their banking apps.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema Changes](#2-database-schema-changes)
3. [API Endpoints](#3-api-endpoints)
4. [Frontend Flow](#4-frontend-flow)
5. [SIP API Integration](#5-sip-api-integration)
6. [Security Considerations](#6-security-considerations)
7. [Error Handling](#7-error-handling)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. System Architecture

### 1.1 High-Level Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│   MINKA     │────▶│   SIP API   │────▶│   Bank      │
│   Browser   │     │   Backend   │     │   (BISA)    │     │   App       │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │                    │
      │  1. Select QR      │                   │                    │
      │  payment method    │                   │                    │
      │───────────────────▶│                   │                    │
      │                    │  2. Generate      │                    │
      │                    │  QR Request       │                    │
      │                    │──────────────────▶│                    │
      │                    │                   │                    │
      │                    │  3. QR Image      │                    │
      │                    │  (Base64)         │                    │
      │                    │◀──────────────────│                    │
      │  4. Display QR     │                   │                    │
      │◀───────────────────│                   │                    │
      │                    │                   │                    │
      │                    │                   │  5. User scans     │
      │                    │                   │  and pays          │
      │                    │                   │◀───────────────────│
      │                    │                   │                    │
      │                    │  6. Callback      │                    │
      │                    │  (Payment         │                    │
      │                    │  confirmed)       │                    │
      │                    │◀──────────────────│                    │
      │  7. Success        │                   │                    │
      │◀───────────────────│                   │                    │
      │                    │                   │                    │
```

### 1.2 Payment Verification Options

There are two ways to verify payment:

1. **Callback (Recommended)**: SIP calls our webhook when payment is confirmed
2. **Polling**: Frontend polls our backend, which queries SIP's `estadoTransaccion` endpoint

---

## 2. Database Schema Changes

### 2.1 Donation Model Updates

Add the following fields to the `Donation` model in `prisma/schema.prisma`:

```prisma
model Donation {
  // ... existing fields ...

  // BISA QR Payment Fields
  bisaAlias             String?   @map("bisa_alias")           // Unique identifier for the QR transaction
  bisaQrId              String?   @map("bisa_qr_id")           // ID returned by SIP when QR is generated
  bisaQrImage           String?   @map("bisa_qr_image") @db.Text  // Base64 QR image
  bisaQrExpiresAt       DateTime? @map("bisa_qr_expires_at")   // QR expiration datetime
  bisaTransactionId     String?   @map("bisa_transaction_id")  // numeroOrdenOriginante from callback
  bisaPayerAccount      String?   @map("bisa_payer_account")   // Masked account number of payer
  bisaPayerName         String?   @map("bisa_payer_name")      // Name of the payer
  bisaPayerDocument     String?   @map("bisa_payer_document")  // CI of the payer
  bisaProcessedAt       DateTime? @map("bisa_processed_at")    // When the payment was processed

  // ... rest of model ...
}
```

### 2.2 New BisaToken Model (Optional - for caching tokens)

```prisma
model BisaToken {
  id        String   @id @default(uuid()) @db.Uuid
  token     String   @db.Text
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(6)

  @@map("bisa_tokens")
}
```

### 2.3 Migration Strategy

```sql
-- Add BISA QR fields to donations table
ALTER TABLE donations ADD COLUMN bisa_alias VARCHAR(50);
ALTER TABLE donations ADD COLUMN bisa_qr_id VARCHAR(30);
ALTER TABLE donations ADD COLUMN bisa_qr_image TEXT;
ALTER TABLE donations ADD COLUMN bisa_qr_expires_at TIMESTAMP;
ALTER TABLE donations ADD COLUMN bisa_transaction_id VARCHAR(30);
ALTER TABLE donations ADD COLUMN bisa_payer_account VARCHAR(50);
ALTER TABLE donations ADD COLUMN bisa_payer_name VARCHAR(250);
ALTER TABLE donations ADD COLUMN bisa_payer_document VARCHAR(50);
ALTER TABLE donations ADD COLUMN bisa_processed_at TIMESTAMP;

-- Create index on bisa_alias for quick lookups
CREATE INDEX idx_donations_bisa_alias ON donations(bisa_alias);
```

---

## 3. API Endpoints

### 3.1 Generate QR Code

**Endpoint:** `POST /api/bisa/generate-qr`

**Request:**
```typescript
interface GenerateQRRequest {
  donationId: string;    // ID of the pending donation
  amount: number;        // Donation amount in BOB
  campaignId: string;    // Campaign ID for reference in glosa
}
```

**Response:**
```typescript
interface GenerateQRResponse {
  success: boolean;
  data?: {
    qrImage: string;        // Base64 encoded QR image
    qrId: string;           // SIP's QR identifier
    alias: string;          // Our unique alias for this transaction
    expiresAt: string;      // ISO datetime when QR expires
    bankName: string;       // Destination bank name
    accountNumber: string;  // Masked destination account
  };
  error?: string;
}
```

**Implementation:**
```typescript
// src/app/api/bisa/generate-qr/route.ts
export async function POST(request: NextRequest) {
  // 1. Validate request
  // 2. Get or refresh BISA token
  // 3. Generate unique alias (e.g., `MINKA-${donationId}-${timestamp}`)
  // 4. Call SIP generaQr endpoint
  // 5. Store QR data in donation record
  // 6. Return QR image to frontend
}
```

### 3.2 Check Payment Status

**Endpoint:** `GET /api/bisa/status/:alias`

**Response:**
```typescript
interface PaymentStatusResponse {
  success: boolean;
  data?: {
    status: 'PENDIENTE' | 'PAGADO' | 'INHABILITADO' | 'ERROR' | 'EXPIRADO';
    processedAt?: string;
    payerName?: string;
    payerAccount?: string;
  };
  error?: string;
}
```

### 3.3 Payment Callback (Webhook)

**Endpoint:** `POST /api/bisa/callback`

**Authentication:** Basic Auth (credentials configured in environment)

**Request (from SIP):**
```typescript
interface BisaCallbackRequest {
  alias: string;
  numeroOrdenOriginante: string;
  monto: number;
  idQr: string;
  moneda: string;
  fechaproceso: string;
  cuentaCliente: string;
  nombreCliente: string;
  documentoCliente: string;
}
```

**Response:**
```typescript
interface BisaCallbackResponse {
  codigo: '0000' | '9999';
  mensaje: string;
}
```

**Implementation:**
```typescript
// src/app/api/bisa/callback/route.ts
export async function POST(request: NextRequest) {
  // 1. Verify Basic Auth credentials
  // 2. Parse callback body
  // 3. Find donation by alias
  // 4. Update donation status to 'completed'
  // 5. Store payer information
  // 6. Update campaign statistics
  // 7. Send notification to campaign owner
  // 8. Return success response
}
```

### 3.4 Cancel/Disable QR

**Endpoint:** `POST /api/bisa/disable-qr`

**Request:**
```typescript
interface DisableQRRequest {
  alias: string;
}
```

---

## 4. Frontend Flow

### 4.1 Updated Donation Steps

1. **Step 1:** Select donation amount (existing)
2. **Step 2:** Select payment method (existing - QR option)
3. **Step 3:** Display QR Code (NEW)
4. **Step 4:** Payment confirmation (updated)
5. **Step 5:** Success & notifications (existing)

### 4.2 QR Payment Step Component

Create a new component: `src/components/donate/QRPaymentStep.tsx`

```typescript
interface QRPaymentStepProps {
  donationId: string;
  amount: number;
  campaignId: string;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

// Component features:
// - Display QR code image
// - Show amount and instructions
// - Countdown timer for QR expiration
// - "Ya pagué" (I paid) button to trigger status check
// - Auto-polling for payment confirmation (every 5 seconds)
// - Loading states
// - Error handling
```

### 4.3 State Machine

```
┌──────────────┐
│   INITIAL    │
└──────┬───────┘
       │ Generate QR
       ▼
┌──────────────┐
│  GENERATING  │
└──────┬───────┘
       │ Success
       ▼
┌──────────────┐     Timeout/Cancel     ┌──────────────┐
│   WAITING    │───────────────────────▶│   EXPIRED    │
│  FOR PAYMENT │                        │  /CANCELLED  │
└──────┬───────┘                        └──────────────┘
       │ Callback received
       │ or status check = PAGADO
       ▼
┌──────────────┐
│   CONFIRMED  │
└──────────────┘
```

### 4.4 UI Components Needed

1. **QRCodeDisplay**: Shows the QR image with scanning instructions
2. **PaymentTimer**: Countdown showing time until QR expires
3. **PaymentInstructions**: Steps for user to complete payment
4. **ManualVerifyButton**: "Ya pagué" button that triggers status check

---

## 5. SIP API Integration

### 5.1 Environment Variables

```env
# BISA/SIP Configuration
BISA_API_URL=https://dev-sip.mc4.com.bo:8443  # Use production URL in prod
BISA_API_KEY=your_api_key_here
BISA_API_KEY_SERVICIO=your_service_api_key_here
BISA_USERNAME=your_username
BISA_PASSWORD=your_password
BISA_CALLBACK_URL=https://yourdomain.com/api/bisa/callback
BISA_CALLBACK_USERNAME=callback_user
BISA_CALLBACK_PASSWORD=callback_password
```

### 5.2 API Client Service

Create `src/lib/bisa/client.ts`:

```typescript
class BisaClient {
  private token: string | null = null;
  private tokenExpiresAt: Date | null = null;

  // Get or refresh authentication token
  async getToken(): Promise<string>;

  // Generate QR code for payment
  async generateQR(params: {
    alias: string;
    amount: number;
    description: string;
    expirationDate: string;  // dd/MM/yyyy format
  }): Promise<GenerateQRResponse>;

  // Check transaction status
  async checkStatus(alias: string): Promise<TransactionStatusResponse>;

  // Disable/cancel a QR code
  async disableQR(alias: string): Promise<void>;
}
```

### 5.3 Token Management

- Tokens are valid for **1 hour**
- Cache token in memory or database
- Refresh token when receiving 401 Unauthorized
- Handle token refresh atomically to prevent race conditions

### 5.4 Alias Generation Strategy

The alias must be unique and traceable. Recommended format:

```
MINKA-{shortDonationId}-{timestamp}
```

Example: `MINKA-abc123-1701936000`

Constraints:
- Max 50 characters
- Alphanumeric only

### 5.5 Callback URL Configuration

The callback URL must be:
1. Publicly accessible (HTTPS)
2. Configured in SIP platform settings
3. Protected with Basic Auth credentials

---

## 6. Security Considerations

### 6.1 Callback Authentication

```typescript
// Verify Basic Auth in callback endpoint
function verifyBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) return false;

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');

  return (
    username === process.env.BISA_CALLBACK_USERNAME &&
    password === process.env.BISA_CALLBACK_PASSWORD
  );
}
```

### 6.2 Amount Validation

Always validate that the callback amount matches the expected donation amount:

```typescript
if (Math.abs(callbackAmount - donation.amount) > 0.01) {
  // Log suspicious activity
  // Reject the callback
}
```

### 6.3 Idempotency

Handle duplicate callbacks gracefully:
- Check if donation is already marked as completed
- Return success without processing again

### 6.4 Rate Limiting

Implement rate limiting on:
- QR generation endpoint (per user/IP)
- Status check endpoint (per donation)

---

## 7. Error Handling

### 7.1 Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `QR_GENERATION_FAILED` | Failed to generate QR | Retry or show error |
| `QR_EXPIRED` | QR code has expired | Generate new QR |
| `PAYMENT_NOT_FOUND` | Alias not found | Check alias validity |
| `AMOUNT_MISMATCH` | Callback amount differs | Log and investigate |
| `TOKEN_EXPIRED` | BISA token expired | Auto-refresh |
| `SERVICE_UNAVAILABLE` | SIP API unavailable | Retry with backoff |

### 7.2 Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,  // ms
  maxDelay: 10000,     // ms
  backoffMultiplier: 2,
};
```

### 7.3 User-Facing Error Messages

```typescript
const ERROR_MESSAGES = {
  QR_GENERATION_FAILED: 'No pudimos generar el código QR. Por favor intenta nuevamente.',
  QR_EXPIRED: 'El código QR ha expirado. Generaremos uno nuevo.',
  PAYMENT_TIMEOUT: 'El tiempo para realizar el pago ha expirado.',
  VERIFICATION_FAILED: 'No pudimos verificar tu pago. Contacta a soporte.',
};
```

---

## 8. Testing Strategy

### 8.1 Development Environment

Use SIP's development endpoint:
- URL: `https://dev-sip.mc4.com.bo:8443`
- Test payments can be simulated from SIP's platform

### 8.2 Test Cases

1. **Happy Path**
   - Generate QR successfully
   - Receive callback and update donation
   - Verify campaign statistics updated

2. **Edge Cases**
   - QR expiration handling
   - Duplicate callback handling
   - Amount mismatch detection
   - Token refresh during request

3. **Error Scenarios**
   - SIP API unavailable
   - Invalid callback credentials
   - Malformed callback payload

### 8.3 Mock Callback for Development

Create a development-only endpoint to simulate callbacks:

```typescript
// Only available in development
POST /api/bisa/dev/simulate-callback
{
  "alias": "MINKA-abc123-1701936000",
  "success": true
}
```

---

## Appendix A: SIP API Reference

### A.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/autenticacion/v1/generarToken` | Generate auth token |
| POST | `/api/v1/generaQr` | Generate QR code |
| POST | `/api/v1/estadoTransaccion` | Check transaction status |
| POST | `/api/v1/inhabilitarPago` | Disable QR code |

### A.2 Transaction States

| State | Description |
|-------|-------------|
| `PENDIENTE` | QR generated, awaiting payment |
| `PAGADO` | Payment completed successfully |
| `INHABILITADO` | QR manually disabled |
| `ERROR` | Payment processing error |
| `EXPIRADO` | QR expired without payment |

### A.3 Callback Response Codes

| Code | Meaning |
|------|---------|
| `0000` | Success - payment accepted |
| `9999` | Error - payment rejected |

---

## Appendix B: Implementation Checklist

### Backend Tasks
- [ ] Add BISA fields to Donation model
- [ ] Run Prisma migration
- [ ] Create BISA client service (`src/lib/bisa/client.ts`)
- [ ] Implement token management
- [ ] Create `POST /api/bisa/generate-qr` endpoint
- [ ] Create `GET /api/bisa/status/:alias` endpoint
- [ ] Create `POST /api/bisa/callback` webhook endpoint
- [ ] Create `POST /api/bisa/disable-qr` endpoint
- [ ] Add environment variables
- [ ] Implement logging and monitoring

### Frontend Tasks
- [ ] Create QRPaymentStep component
- [ ] Update donation flow to include QR step
- [ ] Implement polling for payment status
- [ ] Add QR expiration countdown
- [ ] Add "Ya pagué" manual verification button
- [ ] Handle loading and error states
- [ ] Add mobile-responsive QR display

### DevOps Tasks
- [ ] Configure callback URL in SIP platform
- [ ] Set up environment variables in deployment
- [ ] Configure CORS for callback endpoint
- [ ] Set up monitoring/alerting for payment failures

### Testing Tasks
- [ ] Unit tests for BISA client
- [ ] Integration tests for API endpoints
- [ ] E2E tests for donation flow
- [ ] Test callback with SIP dev simulator
