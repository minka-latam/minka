# Donation API Documentation

This document outlines the donation management system for the Minka platform.

## Overview

The donation system allows users to make donations to campaigns. The system supports:

- Anonymous and authenticated donations
- Multiple payment methods (credit card, QR code, bank transfer)
- Notification preferences for campaign updates
- Payment status tracking

## API Endpoints

### Create Donation

**POST /api/donation**

Creates a new donation for a campaign.

**Request Body:**

```json
{
  "campaignId": "uuid",
  "amount": 100.0,
  "paymentMethod": "card", // "card" or "qr"
  "message": "Optional message",
  "isAnonymous": false,
  "notificationEnabled": true,
  "customAmount": false
}
```

**Response:**

```json
{
  "success": true,
  "donationId": "uuid"
}
```

### Get Donation Details

**GET /api/donation/[id]**

Retrieves details about a specific donation.

**Response:**

```json
{
  "id": "uuid",
  "amount": 100.0,
  "message": "Optional message",
  "paymentStatus": "pending",
  "isAnonymous": false,
  "notificationEnabled": true,
  "createdAt": "2023-05-20T14:30:00Z",
  "campaign": {
    "id": "uuid",
    "title": "Campaign Title"
  }
}
```

### Update Donation

**PATCH /api/donation/[id]**

Updates a donation's notification preferences or status.

**Request Body:**

```json
{
  "notificationEnabled": true
}
```

**Response:**

```json
{
  "id": "uuid",
  "notificationEnabled": true,
  "paymentStatus": "pending"
}
```

### List Campaign Donations

**GET /api/campaign/[id]/donations**

Lists all donations for a specific campaign with pagination.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 100.0,
      "message": "Optional message",
      "createdAt": "2023-05-20T14:30:00Z",
      "paymentStatus": "completed",
      "donor": {
        "id": "uuid",
        "name": "Donor Name",
        "profilePicture": "url"
      }
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 45,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### List User Donations

**GET /api/profile/donations**

Lists all donations made by the authenticated user with pagination.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 100.0,
      "createdAt": "2023-05-20T14:30:00Z",
      "paymentStatus": "completed",
      "campaign": {
        "id": "uuid",
        "title": "Campaign Title",
        "mainImage": "url"
      }
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 2,
    "totalCount": 15,
    "totalAmount": 1500.0,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Payment Webhook

**POST /api/webhook**

Handles payment status updates from payment processors.

**Request Body:**

```json
{
  "donationId": "uuid",
  "paymentStatus": "completed",
  "transactionId": "optional-transaction-id"
}
```

**Response:**

```json
{
  "success": true,
  "status": "updated",
  "donation": {
    "id": "uuid",
    "paymentStatus": "completed"
  }
}
```

## Database Schema

Donations are stored in the `donations` table with the following key fields:

- `id` - Unique identifier
- `campaignId` - Foreign key to the campaign
- `donorId` - Foreign key to the donor's profile
- `amount` - Donation amount
- `paymentMethod` - Method used for payment (credit_card, qr, bank_transfer)
- `paymentStatus` - Status of the payment (pending, completed, failed, refunded)
- `isAnonymous` - Whether the donation should be displayed as anonymous
- `notificationEnabled` - Whether the donor wants to receive updates

## Anonymous Donations

Anonymous donations are handled by:

1. Creating/reusing a special anonymous donor profile
2. Setting the `isAnonymous` flag to `true`
3. Limiting the information returned to other users

## Campaign Statistics

When a donation is created or its payment status changes, the system automatically updates:

- The campaign's total collected amount
- The donor count
- The percentage funded

## Running Migrations

To apply database schema changes, run:

```
node scripts/migrate.js
```

This will:

1. Generate a new migration based on schema changes
2. Apply the migration to the database
3. Generate an updated Prisma client
