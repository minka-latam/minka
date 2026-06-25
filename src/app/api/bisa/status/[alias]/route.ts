import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bisaClient } from '@/lib/bisa/client'
import { completeBisaDonationPayment } from '@/lib/bisa/payment-completion'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alias: string }> },
) {
  const { alias } = await params

  if (!alias) {
    return NextResponse.json(
      { error: 'Alias is required' },
      { status: 400 },
    )
  }

  try {
    // Check local DB first
    const donation = await prisma.donation.findFirst({
      where: { bisaAlias: alias },
    })

    if (!donation) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'EXPIRADO',
          message: 'QR no encontrado',
        },
      })
    }

    if (donation.paymentStatus === 'completed') {
      return NextResponse.json({
        success: true,
        data: { status: 'PAGADO' },
      })
    }

    // Call BISA API
    const response = await bisaClient.checkStatus(alias)

    if (!response.success || !response.data) {
      return NextResponse.json({
        success: false,
        error:
          response.error ||
          'Error al consultar estado del QR',
        needsRegeneration: true, // Signal that a new QR should be generated
      })
    }

    const status = response.data.status

    // If paid, update DB (paymentStatus is already known to not be "completed" from early return above)
    if (status === 'PAGADO') {
      const completion = await completeBisaDonationPayment({
        donation,
        confirmation: {
          alias,
          amount: response.data.amount,
          currency: response.data.currency,
          transactionId: response.data.transactionId,
          qrId: response.data.qrId,
          payerName: response.data.payerName,
          payerAccount: response.data.payerAccount,
          payerDocument: response.data.payerDocument,
          processedAt: response.data.processedAt,
          source: "status",
        },
      })

      if (completion.error) {
        return NextResponse.json(
          {
            success: false,
            error: completion.error,
          },
          { status: 409 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    })
  } catch (error) {
    console.error('Error checking status:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
