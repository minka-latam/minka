import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  PaymentMethod,
  PaymentStatus,
  TransferStatus,
  type Prisma,
} from '@prisma/client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  UserDonationTable,
  UserDonationData,
} from '@/components/dashboard/user-donation-table'
import {
  calculatePlatformFee,
  formatCurrency,
} from '@/lib/campaign-finance'
import { prisma } from '@/lib/prisma'
import { ProfileData } from '@/types'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { AdminUserProfileLink } from '@/components/dashboard/admin-user-profile-link'

type SearchParams = {
  campaignId?: string | string[]
  campaignSearch?: string | string[]
  donorSearch?: string | string[]
  method?: string | string[]
  status?: string | string[]
  sort?: string | string[]
}
export interface AdminDonationData {
  id: string
  amount: number
  payment_status: PaymentStatus | string
  created_at: string
  campaigns:
    | {
        title: string | null
      }[]
    | null
  profiles:
    | {
        id: string
        name: string | null
        email: string | null
      }[]
    | null
}

function paramValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value || ''
}

function paymentMethodLabel(method: PaymentMethod) {
  if (method === PaymentMethod.qr) return 'QR'
  if (method === PaymentMethod.credit_card) return 'Tarjeta'
  return 'Transferencia'
}

function paymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pendiente',
    completed: 'Completada',
    failed: 'Fallida',
    refunded: 'Reembolsada',
    cancelled: 'Cancelada',
  }

  return labels[status] ?? status
}

function statusBadgeVariant(status: PaymentStatus) {
  if (status === PaymentStatus.completed) return 'success'
  if (status === PaymentStatus.pending) return 'warning'
  if (
    status === PaymentStatus.failed ||
    status === PaymentStatus.cancelled
  ) {
    return 'destructive'
  }

  return 'outline'
}

function toNumber(value: unknown) {
  return Number(value || 0)
}

function formatBoliviaDateTime(value: Date | string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const parts = new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date)

  const partMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${partMap.day}/${partMap.month}/${partMap.year} ${partMap.hour}:${partMap.minute}`
}

function addTotals(
  donations: Array<{
    amount: unknown
    tip_amount: unknown
  }>,
) {
  return donations.reduce(
    (totals, donation) => {
      const amount = toNumber(donation.amount)
      const tip = toNumber(donation.tip_amount)

      totals.amount += amount
      totals.tips += tip
      totals.total += amount + tip

      return totals
    },
    { amount: 0, tips: 0, total: 0 },
  )
}

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<Pick<ProfileData, 'role'>>()

  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    const params = await searchParams
    const campaignId = paramValue(params.campaignId)
    const campaignSearch = paramValue(
      params.campaignSearch,
    ).trim()
    const donorSearch = paramValue(
      params.donorSearch,
    ).trim()
    const method = paramValue(params.method)
    const statusParam =
      paramValue(params.status) || PaymentStatus.completed
    const sort =
      paramValue(params.sort) === 'asc' ? 'asc' : 'desc'

    const validMethod = Object.values(
      PaymentMethod,
    ).includes(method as PaymentMethod)
      ? (method as PaymentMethod)
      : null
    const validStatus =
      statusParam === 'all'
        ? 'all'
        : Object.values(PaymentStatus).includes(
              statusParam as PaymentStatus,
            )
          ? (statusParam as PaymentStatus)
          : PaymentStatus.completed

    const campaignFilter: Prisma.DonationWhereInput =
      campaignId
        ? { campaignId }
        : campaignSearch
          ? {
              campaign: {
                title: {
                  contains: campaignSearch,
                  mode: 'insensitive',
                },
              },
            }
          : {}

    const donorFilter: Prisma.DonationWhereInput =
      donorSearch
        ? {
            OR: [
              {
                donor: {
                  name: {
                    contains: donorSearch,
                    mode: 'insensitive',
                  },
                },
              },
              {
                donor: {
                  email: {
                    contains: donorSearch,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}

    const baseWhere: Prisma.DonationWhereInput = {
      ...campaignFilter,
      ...donorFilter,
      ...(validMethod
        ? { paymentMethod: validMethod }
        : {}),
    }

    const tableWhere: Prisma.DonationWhereInput = {
      ...baseWhere,
      ...(validStatus !== 'all'
        ? { paymentStatus: validStatus }
        : {}),
    }

    const completedWhere: Prisma.DonationWhereInput = {
      ...baseWhere,
      paymentStatus: PaymentStatus.completed,
    }

    const custodyDonationWhere: Prisma.DonationWhereInput = {
      ...campaignFilter,
      paymentStatus: PaymentStatus.completed,
    }

    const custodyTransferWhere: Prisma.FundTransferWhereInput = {
      status: TransferStatus.completed,
      ...(campaignId
        ? { campaignId }
        : campaignSearch
          ? {
              campaign: {
                title: {
                  contains: campaignSearch,
                  mode: 'insensitive',
                },
              },
            }
          : {}),
    }

    const [
      campaigns,
      donations,
      completedDonations,
      completedQrDonations,
      completedCardDonations,
      custodyDonations,
      completedTransfers,
    ] = await Promise.all([
      prisma.campaign.findMany({
        where: campaignSearch
          ? {
              title: {
                contains: campaignSearch,
                mode: 'insensitive',
              },
            }
          : {},
        orderBy: { title: 'asc' },
        take: 100,
        select: {
          id: true,
          title: true,
        },
      }),
      prisma.donation.findMany({
        where: tableWhere,
        orderBy: { createdAt: sort },
        take: 200,
        include: {
          campaign: {
            select: {
              title: true,
            },
          },
          donor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.donation.findMany({
        where: completedWhere,
        select: {
          amount: true,
          tip_amount: true,
        },
      }),
      prisma.donation.findMany({
        where: {
          ...completedWhere,
          paymentMethod: PaymentMethod.qr,
        },
        select: {
          amount: true,
          tip_amount: true,
        },
      }),
      prisma.donation.findMany({
        where: {
          ...completedWhere,
          paymentMethod: PaymentMethod.credit_card,
        },
        select: {
          amount: true,
          tip_amount: true,
        },
      }),
      prisma.donation.findMany({
        where: custodyDonationWhere,
        select: {
          amount: true,
          tip_amount: true,
        },
      }),
      prisma.fundTransfer.aggregate({
        where: custodyTransferWhere,
        _sum: { amount: true },
      }),
    ])

    const totals = addTotals(completedDonations)
    const qrTotals = addTotals(completedQrDonations)
    const cardTotals = addTotals(completedCardDonations)
    const custodyTotals = addTotals(custodyDonations)
    const completedTransferAmount = toNumber(
      completedTransfers._sum.amount,
    )
    const currentCustodyBalance =
      custodyTotals.total - completedTransferAmount
    const platformFee = calculatePlatformFee(totals.amount)
    const exportParams = new URLSearchParams()
    if (campaignId) exportParams.set('campaignId', campaignId)
    if (campaignSearch) exportParams.set('campaignSearch', campaignSearch)
    if (donorSearch) exportParams.set('donorSearch', donorSearch)
    if (validMethod) exportParams.set('method', validMethod)
    exportParams.set('status', validStatus)
    exportParams.set('sort', sort)
    const exportHref = `/api/admin/donations/export?${exportParams.toString()}`

    return (
      <div className='space-y-6 p-4 md:p-6'>
        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900'>
              Donaciones
            </h1>
            <p className='mt-1 text-sm text-gray-600'>
              Revisa totales por campaña y el listado de
              donadores.
            </p>
          </div>
          <Link
            href={exportHref}
            className='inline-flex h-10 items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            <Download className='mr-2 h-4 w-4' />
            Exportar datos
          </Link>
        </div>

        <Card className='rounded-lg'>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtra por campaña, donador, método, estado y
              fecha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className='grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1.4fr_1fr_1fr_1fr_auto_auto] xl:items-end'>
              <label className='space-y-1 text-sm'>
                <span className='font-medium text-gray-700'>
                  Buscar campaña
                </span>
                <input
                  name='campaignSearch'
                  defaultValue={campaignSearch}
                  placeholder='Título de campaña'
                  className='h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'
                />
              </label>

              <label className='space-y-1 text-sm'>
                <span className='font-medium text-gray-700'>
                  Campaña
                </span>
                <select
                  name='campaignId'
                  defaultValue={campaignId}
                  className='h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'
                >
                  <option value=''>
                    Todas las campañas
                  </option>
                  {campaigns.map((campaign) => (
                    <option
                      key={campaign.id}
                      value={campaign.id}
                    >
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className='space-y-1 text-sm'>
                <span className='font-medium text-gray-700'>
                  Donador
                </span>
                <input
                  name='donorSearch'
                  defaultValue={donorSearch}
                  placeholder='Nombre o email'
                  className='h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'
                />
              </label>

              <label className='space-y-1 text-sm'>
                <span className='font-medium text-gray-700'>
                  Método
                </span>
                <select
                  name='method'
                  defaultValue={validMethod ?? ''}
                  className='h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'
                >
                  <option value=''>Todos</option>
                  <option value={PaymentMethod.qr}>
                    QR
                  </option>
                  <option value={PaymentMethod.credit_card}>
                    Tarjeta
                  </option>
                  <option
                    value={PaymentMethod.bank_transfer}
                  >
                    Transferencia
                  </option>
                </select>
              </label>

              <label className='space-y-1 text-sm'>
                <span className='font-medium text-gray-700'>
                  Estado
                </span>
                <select
                  name='status'
                  defaultValue={validStatus}
                  className='h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'
                >
                  <option value='all'>Todas</option>
                  {Object.values(PaymentStatus).map(
                    (paymentStatus) => (
                      <option
                        key={paymentStatus}
                        value={paymentStatus}
                      >
                        {paymentStatusLabel(paymentStatus)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className='space-y-1 text-sm'>
                <span className='font-medium text-gray-700'>
                  Fecha
                </span>
                <select
                  name='sort'
                  defaultValue={sort}
                  className='h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'
                >
                  <option value='desc'>
                    Más recientes
                  </option>
                  <option value='asc'>Más antiguas</option>
                </select>
              </label>

              <button
                type='submit'
                className='h-10 rounded-full bg-[#2c6e49] px-5 text-sm font-medium text-white hover:bg-[#23583a]'
              >
                Filtrar
              </button>

              <Link
                href='/dashboard/donations'
                className='flex h-10 items-center justify-center rounded-full border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                Limpiar
              </Link>
            </form>
          </CardContent>
        </Card>

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
          <Card className='rounded-lg'>
            <CardHeader className='pb-2'>
              <CardDescription>
                Saldo actual en custodia
              </CardDescription>
              <CardTitle>
                {formatCurrency(currentCustodyBalance)}
              </CardTitle>
              <p className='text-xs text-gray-500'>
                Aportes + tips cobrados menos{' '}
                {formatCurrency(completedTransferAmount)} transferidos
              </p>
            </CardHeader>
          </Card>
          <Card className='rounded-lg'>
            <CardHeader className='pb-2'>
              <CardDescription>
                Tips a Minka
              </CardDescription>
              <CardTitle>
                {formatCurrency(totals.tips)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className='rounded-lg'>
            <CardHeader className='pb-2'>
              <CardDescription>5% fee</CardDescription>
              <CardTitle>
                {formatCurrency(platformFee)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className='rounded-lg'>
            <CardHeader className='pb-2'>
              <CardDescription>
                Total procesado
              </CardDescription>
              <CardTitle>
                {formatCurrency(totals.total)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className='rounded-lg'>
            <CardHeader className='pb-2'>
              <CardDescription>
                Donaciones completadas
              </CardDescription>
              <CardTitle>
                {completedDonations.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <Card className='rounded-lg'>
            <CardHeader className='pb-2'>
              <CardDescription>
                Acumulado QR
              </CardDescription>
              <CardTitle>
                {formatCurrency(qrTotals.amount)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className='rounded-lg'>
            <CardHeader className='pb-2'>
              <CardDescription>
                Acumulado tarjeta
              </CardDescription>
              <CardTitle>
                {formatCurrency(cardTotals.amount)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className='rounded-lg'>
          <CardHeader>
            <CardTitle>Lista de donadores</CardTitle>
            <CardDescription>
              Hasta 200 registros según los filtros
              seleccionados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-[150px]'>
                    Fecha y hora
                  </TableHead>
                  <TableHead>Donador</TableHead>
                  <TableHead>Campaña</TableHead>
                  <TableHead className='text-right'>
                    Monto
                  </TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='py-8 text-center text-muted-foreground'
                    >
                      No hay donaciones con estos filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className='whitespace-nowrap font-medium'>
                        {formatBoliviaDateTime(
                          donation.createdAt,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='font-medium'>
                          {donation.isAnonymous ? (
                            'Anónimo'
                          ) : (
                            <AdminUserProfileLink
                              userId={donation.donor.id}
                              className='text-[#2c6e49] hover:underline'
                            >
                              {donation.donor.name || 'Sin nombre'}
                            </AdminUserProfileLink>
                          )}
                        </div>
                        {!donation.isAnonymous && (
                          <div className='text-xs text-gray-500'>
                            {donation.donor.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {donation.campaign.title}
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        {formatCurrency(
                          toNumber(donation.amount),
                        )}
                      </TableCell>
                      <TableCell>
                        {paymentMethodLabel(
                          donation.paymentMethod,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant(
                            donation.paymentStatus,
                          )}
                        >
                          {paymentStatusLabel(
                            donation.paymentStatus,
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: userDonations, error } = await supabase
    .from('donations')
    .select(
      `
      id,
      amount,
      payment_status,
      created_at,
      campaign_id,
      campaigns (
        id,
        title
      )
    `,
    )
    .eq('donor_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user donations:', error)
    return (
      <div className='p-6 text-red-600'>
        Error loading your donations. Please try again
        later.
      </div>
    )
  }

  const validUserDonations: UserDonationData[] = (
    userDonations || []
  ).map((donation: any) => ({
    id: donation.id,
    amount: donation.amount,
    payment_status: donation.payment_status,
    created_at: donation.created_at,
    campaign: {
      id: donation.campaigns?.id || donation.campaign_id,
      title: donation.campaigns?.title || 'Sin título',
    },
  }))

  return (
    <div className='space-y-6 p-4 md:p-6'>
      <h1 className='text-3xl font-bold text-gray-800'>
        Historial de donaciones
      </h1>
      <div className='rounded-lg bg-white p-4 shadow-sm md:p-6'>
        <UserDonationTable donations={validUserDonations} />
      </div>
    </div>
  )
}
