'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowRight,
  QrCode,
  CreditCard,
  ArrowUp,
} from 'lucide-react'
import { Header } from '@/components/views/landing-page/Header'
import { Footer } from '@/components/views/landing-page/Footer'
import { createBrowserClient } from '@supabase/ssr'
import { useCampaign } from '@/hooks/useCampaign'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { QRPaymentStep } from '@/components/donate/QRPaymentStep'
import { toast } from '@/components/ui/use-toast'
import { formatRegionDisplayName } from '@/lib/region-utils'
import { CampaignShareMenu } from '@/components/share/CampaignShareMenu'
import {
  DONATION_CLAIM_INTENT_KEY,
  type DonationClaimIntent,
} from '@/constants/donation-claim'
import { addMoney, roundMoney } from '@/lib/money'

// Key for storing pending donation in localStorage
const PENDING_DONATION_KEY = 'minka_pending_donation'
const PENDING_CARD_CHECKOUT_KEY =
  'minka_pending_card_checkout'

const DONATION_AMOUNTS_BS = [
  { value: 50 },
  { value: 100 },
  { value: 200 },
  { value: 500 },
]

const DONATION_AMOUNTS_CARD = [
  { value: 10 },
  { value: 20 },
  { value: 50 },
  { value: 100 },
]

// Define payment methods
const PAYMENT_METHODS = [
  {
    id: 'qr',
    title: 'Código QR',
    description:
      'Abre la app de tu banco, escanea el código QR y sigue las instrucciones.',
    icon: <QrCode className='h-6 w-6' />,
  },
  {
    id: 'card',
    title: 'Tarjeta de crédito/débito Internacional*',
    description:
      'Opción para pagos desde el exterior de Bolivia solamente.',
    icon: <CreditCard className='h-6 w-6' />,
  },
]

// Create a client component that uses params
export function DonatePageContent({
  campaignId,
}: {
  campaignId: string
}) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Use our custom hook to fetch campaign data
  const {
    campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId)

  // Add user state
  const [user, setUser] = useState<User | null>(null)

  // State variables
  const [selectedAmount, setSelectedAmount] = useState<
    number | null
  >(null)
  const [customAmount, setCustomAmount] =
    useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<
    string | null
  >(null)
  const [minkaContribution, setMinkaContribution] =
    useState<number>(0)
  const [showSuccessModal, setShowSuccessModal] =
    useState(false)
  const [donationId, setDonationId] = useState<
    string | null
  >(null)
  const [qrAccessToken, setQrAccessToken] = useState<
    string | null
  >(null)
  const activeDonationIdRef = useRef<string | null>(null)
  const [activeDonationId, setActiveDonationId] = useState<
    string | null
  >(null)
  const [reviewState, setReviewState] = useState(false)
  const [
    wantsAccountAfterDonation,
    setWantsAccountAfterDonation,
  ] = useState(false)
  const [
    wantsSignInAfterDonation,
    setWantsSignInAfterDonation,
  ] = useState(false)
  const [
    wantsAnonymousDonation,
    setWantsAnonymousDonation,
  ] = useState(false)
  const [donationClaimIntent, setDonationClaimIntent] =
    useState<DonationClaimIntent | null>(null)

  // State for error notification
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [infoMessage, setInfoMessage] = useState<
    string | null
  >(null)

  // Read redirect parameters from Tripto checkout
  const searchParams = useSearchParams()
  const donationIdFromRedirect =
    searchParams.get('donationId')

  // Custom tip state
  const [tipMode, setTipMode] = useState<
    'percentage' | 'custom'
  >('percentage')
  const [customTipAmount, setCustomTipAmount] =
    useState<string>('')

  // QR Payment state
  const [showQRStep, setShowQRStep] = useState(false)

  // Ref to prevent double initialization
  const initRef = useRef(false)

  useEffect(() => {
    const resetCardRedirectState = () => {
      setIsSubmitting(false)
      setInfoMessage((message) =>
        message?.includes('redirigiendo') ? null : message,
      )
    }

    window.addEventListener(
      'pageshow',
      resetCardRedirectState,
    )
    window.addEventListener('focus', resetCardRedirectState)

    return () => {
      window.removeEventListener(
        'pageshow',
        resetCardRedirectState,
      )
      window.removeEventListener(
        'focus',
        resetCardRedirectState,
      )
    }
  }, [])

  // Load user data and check for pending donation on component mount
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data?.user || null)
      } catch (error) {
        console.error(
          'Error checking authentication:',
          error,
        )
      }
    }

    // Check for pending donation in localStorage
    const checkPendingDonation = () => {
      try {
        const stored = localStorage.getItem(
          PENDING_DONATION_KEY,
        )
        if (stored) {
          const pendingDonation = JSON.parse(stored)
          // Check if it's for the same campaign and not too old (24 hours)
          const createdAt = new Date(
            pendingDonation.createdAt,
          ).getTime()
          const now = Date.now()
          const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

          if (
            pendingDonation.campaignId === campaignId &&
            now - createdAt < MAX_AGE
          ) {
            setDonationId(pendingDonation.donationId)
            setQrAccessToken(
              pendingDonation.qrAccessToken ?? null,
            )
            setSelectedAmount(pendingDonation.amount)
            setPaymentMethod(pendingDonation.paymentMethod)
            const pendingTipAmount = Number(
              pendingDonation.tipAmount ?? 0,
            )
            if (pendingTipAmount > 0) {
              setTipMode('custom')
              setCustomTipAmount(String(pendingTipAmount))
            }
            if (pendingDonation.paymentMethod === 'qr') {
              setShowQRStep(true)
            }
          } else {
            // Clear old or mismatched pending donation
            localStorage.removeItem(PENDING_DONATION_KEY)
          }
        }
      } catch (error) {
        console.error(
          'Error checking pending donation:',
          error,
        )
      }
    }

    checkUser()
    checkPendingDonation()
  }, [supabase, campaignId])

  // Tripto redirect + poll using handler
  useEffect(() => {
    if (!donationIdFromRedirect) return

    // persist donationId for future re-polling even if URL is cleaned
    activeDonationIdRef.current = donationIdFromRedirect
    setActiveDonationId(donationIdFromRedirect)
    setDonationId(donationIdFromRedirect) // optional: keeps the rest of your component consistent

    pollDonationStatus(donationIdFromRedirect)
  }, [donationIdFromRedirect])

  // Calculate donation details
  const donationAmount =
    selectedAmount ||
    (customAmount ? Number.parseFloat(customAmount) : 0)
  const platformFee =
    tipMode === 'percentage'
      ? roundMoney(
          donationAmount * (minkaContribution / 100),
        )
      : roundMoney(Number.parseFloat(customTipAmount) || 0)
  const totalAmount = addMoney(donationAmount, platformFee)
  const currencyPrefix =
    paymentMethod === 'card' ? '$' : 'Bs.'
  const donationAmounts =
    paymentMethod === 'card'
      ? DONATION_AMOUNTS_CARD
      : DONATION_AMOUNTS_BS
  const isDonationAmountValid =
    Number.isFinite(donationAmount) &&
    donationAmount >= 1 &&
    donationAmount <= 50000
  const isPaymentFormReady =
    Boolean(paymentMethod) && isDonationAmountValid
  const isDonationAnonymous = user
    ? wantsAnonymousDonation
    : true

  const saveDonationClaimIntent = (
    intent: DonationClaimIntent | null,
  ) => {
    if (!intent || !intent.donationId || !intent.claimToken)
      return null

    localStorage.setItem(
      DONATION_CLAIM_INTENT_KEY,
      JSON.stringify(intent),
    )
    setDonationClaimIntent(intent)
    return intent
  }

  const getStoredDonationClaimIntent = (
    completedDonationId: string,
  ): DonationClaimIntent | null => {
    const readStored = (key: string) => {
      try {
        const raw = key.startsWith('session:')
          ? sessionStorage.getItem(
              key.replace('session:', ''),
            )
          : localStorage.getItem(key)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    }

    const pendingCardCheckout = readStored(
      `session:${PENDING_CARD_CHECKOUT_KEY}`,
    )
    if (
      pendingCardCheckout?.donationId ===
        completedDonationId &&
      pendingCardCheckout?.claimToken
    ) {
      return {
        donationId: completedDonationId,
        claimToken: pendingCardCheckout.claimToken,
        campaignId,
        createdAt:
          pendingCardCheckout.createdAt ||
          new Date().toISOString(),
      }
    }

    const pendingDonation = readStored(PENDING_DONATION_KEY)
    if (
      pendingDonation?.donationId === completedDonationId &&
      pendingDonation?.claimToken
    ) {
      return {
        donationId: completedDonationId,
        claimToken: pendingDonation.claimToken,
        campaignId,
        createdAt:
          pendingDonation.createdAt ||
          new Date().toISOString(),
      }
    }

    return donationClaimIntent?.donationId ===
      completedDonationId
      ? donationClaimIntent
      : null
  }

  const shouldRedirectToSignupAfterDonation = (
    completedDonationId: string,
  ) => {
    try {
      const storedCheckout = sessionStorage.getItem(
        PENDING_CARD_CHECKOUT_KEY,
      )
      if (storedCheckout) {
        const pendingCheckout = JSON.parse(storedCheckout)
        if (
          pendingCheckout?.donationId ===
          completedDonationId
        ) {
          return Boolean(
            pendingCheckout.wantsAccountAfterDonation,
          )
        }
      }

      const storedDonation = localStorage.getItem(
        PENDING_DONATION_KEY,
      )
      if (storedDonation) {
        const pendingDonation = JSON.parse(storedDonation)
        if (
          pendingDonation?.donationId ===
          completedDonationId
        ) {
          return Boolean(
            pendingDonation.wantsAccountAfterDonation,
          )
        }
      }
    } catch {
      return wantsAccountAfterDonation
    }

    return wantsAccountAfterDonation
  }

  const shouldRedirectToSignInAfterDonation = (
    completedDonationId: string,
  ) => {
    try {
      const storedCheckout = sessionStorage.getItem(
        PENDING_CARD_CHECKOUT_KEY,
      )
      if (storedCheckout) {
        const pendingCheckout = JSON.parse(storedCheckout)
        if (
          pendingCheckout?.donationId ===
          completedDonationId
        ) {
          return Boolean(
            pendingCheckout.wantsSignInAfterDonation,
          )
        }
      }

      const storedDonation = localStorage.getItem(
        PENDING_DONATION_KEY,
      )
      if (storedDonation) {
        const pendingDonation = JSON.parse(storedDonation)
        if (
          pendingDonation?.donationId ===
          completedDonationId
        ) {
          return Boolean(
            pendingDonation.wantsSignInAfterDonation,
          )
        }
      }
    } catch {
      return wantsSignInAfterDonation
    }

    return wantsSignInAfterDonation
  }

  const finishSuccessfulDonation = (
    completedDonationId: string,
  ) => {
    const intent = getStoredDonationClaimIntent(
      completedDonationId,
    )

    if (!user && intent) {
      saveDonationClaimIntent(intent)
    }

    sessionStorage.removeItem(PENDING_CARD_CHECKOUT_KEY)
    localStorage.removeItem(PENDING_DONATION_KEY)

    if (
      !user &&
      intent &&
      shouldRedirectToSignInAfterDonation(
        completedDonationId,
      )
    ) {
      router.push('/sign-in?donationClaim=1')
      return
    }

    if (
      !user &&
      intent &&
      shouldRedirectToSignupAfterDonation(
        completedDonationId,
      )
    ) {
      router.push('/sign-up?donationClaim=1')
      return
    }

    setShowSuccessModal(true)
  }

  //Poll by donationId
  const pollAbortRef = useRef<AbortController | null>(null)
  const pollDonationStatus = async (donationId: string) => {
    // cancel previous poll if any
    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller

    const sleep = (ms: number) =>
      new Promise((r) => setTimeout(r, ms))

    try {
      setReviewState(false)
      setInfoMessage(
        'Estamos confirmando tu pago... Puede tardar unos segundos.',
      )
      setIsSubmitting(true)
      setErrorMessage(null)

      const maxAttempts = 25
      const intervalMs = 1600

      for (let i = 0; i < maxAttempts; i++) {
        if (controller.signal.aborted) return

        const res = await fetch(
          `/api/donation/status?donationId=${encodeURIComponent(donationId)}`,
          { cache: 'no-store', signal: controller.signal },
        )

        const data = await res.json().catch(() => null)

        if (res.ok && data?.success) {
          // rehydrate UI from DB here (see section 3)

          const paymentStatus =
            data?.donation?.paymentStatus
          const dbAmount = Number(
            data?.donation?.amount ?? 0,
          )
          const dbTip = Number(
            data?.donation?.tipAmount ?? 0,
          )

          // 1) amount: set either selectedAmount (if matches predefined) or customAmount
          const matchesPreset = [
            ...DONATION_AMOUNTS_BS,
            ...DONATION_AMOUNTS_CARD,
          ].some((o) => o.value === dbAmount)
          if (matchesPreset) {
            setSelectedAmount(dbAmount)
            setCustomAmount('')
          } else {
            setSelectedAmount(null)
            setCustomAmount(
              dbAmount ? String(dbAmount) : '',
            )
          }

          // 2) tip: easiest is to force custom tip mode so platformFee reflects dbTip exactly
          setTipMode('custom')
          setCustomTipAmount(dbTip ? String(dbTip) : '')

          // 3) ensure payment method in UI (optional but consistent)
          setPaymentMethod('card')

          if (paymentStatus === 'completed') {
            setInfoMessage(null)
            setIsSubmitting(false)

            window.history.replaceState(
              {},
              '',
              window.location.pathname,
            )
            finishSuccessfulDonation(donationId)
            return
          }

          if (paymentStatus === 'failed') {
            setInfoMessage(null)
            setErrorMessage(
              'Lo siento, tu pago no se completó. Por favor inténtalo nuevamente.',
            )
            setIsSubmitting(false)

            window.history.replaceState(
              {},
              '',
              window.location.pathname,
            )
            return
          }
        }

        await sleep(intervalMs)
      }

      setInfoMessage(
        'Aún no pudimos confirmar el estado de tu pago. En algunos casos la confirmación puede tardar un poco más. Espera 1–2 minutos y presiona ‘Revisar estado’ o vuelve a intentar el pago.',
      )
      setIsSubmitting(false)
      setReviewState(true)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError')
        return
      setInfoMessage(null)
      setErrorMessage(
        'No pudimos confirmar el estado del pago todavía. Por favor intenta nuevamente en unos segundos.',
      )
      setIsSubmitting(false)
      setReviewState(true)
    }
  }

  useEffect(() => {
    return () => pollAbortRef.current?.abort()
  }, [])

  useEffect(() => {
    if (selectedAmount === null) return

    const isValidAmount = donationAmounts.some(
      (option) => option.value === selectedAmount,
    )
    if (!isValidAmount) {
      setSelectedAmount(null)
    }
  }, [paymentMethod, donationAmounts, selectedAmount])

  // Handle amount selection
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  // Handle custom amount input
  const handleCustomAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value
    if (/^\d*(\.\d{0,2})?$/.test(value)) {
      const numValue = Number.parseFloat(value)
      if (!value || numValue <= 50000) {
        setCustomAmount(value)
        setSelectedAmount(null)
      } else {
        toast({
          title: 'Monto inválido',
          description:
            'El monto máximo de donación es Bs. 50,000.',
          variant: 'destructive',
        })
      }
    }
  }

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method)
    setErrorMessage(null)
    setInfoMessage(null)
  }

  // Handle donation confirmation
  const handleConfirmDonation = async () => {
    if (!campaignId) {
      setErrorMessage('No campaign selected for donation.')
      return
    }

    // Clear any previous errors
    setErrorMessage(null)
    setInfoMessage(null)
    setIsSubmitting(true)

    const selectedMethod = paymentMethod || 'qr'

    try {
      // 🔹 Branch 1: Tripto (card)
      if (selectedMethod === 'card') {
        const checkoutSignature = {
          campaignId,
          donorId: user?.id ?? null,
          amount: donationAmount,
          tipAmount: platformFee,
          wantsAccountAfterDonation,
          wantsSignInAfterDonation,
        }
        sessionStorage.removeItem(PENDING_CARD_CHECKOUT_KEY)

        setInfoMessage(
          'Estamos redirigiendo a la plataforma segura de pago por tarjeta, espera por favor.',
        )
        const response = await fetch(
          '/api/tripto/payment',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campaignId,
              donorId: user?.id ?? null,
              amount: donationAmount,
              tipAmount: platformFee,
              message: '',
              isAnonymous: isDonationAnonymous,
              notificationEnabled: false,
              paymentMethod: selectedMethod,
            }),
          },
        )

        const data = await response.json()

        if (!response.ok || !data.success || !data.url) {
          setInfoMessage(null)
          const error = data?.error

          let userMessage =
            'No pudimos iniciar el pago en este momento. Por favor, inténtalo nuevamente.'

          if (error === 'PAYMENT_PROVIDER_UNAVAILABLE') {
            userMessage =
              'El servicio de pagos está teniendo problemas en este momento. Tu donación no se ha realizado. Por favor, inténtalo nuevamente en unos minutos o utiliza otro método de pago.'
          }

          if (error === 'PAYMENT_PROVIDER_ERROR') {
            userMessage =
              'Hubo un problema al iniciar el pago. Por favor, inténtalo nuevamente.'
          }

          setInfoMessage(null)
          setErrorMessage(userMessage)

          return
        }

        // Redirect user to Tripto checkout
        sessionStorage.setItem(
          PENDING_CARD_CHECKOUT_KEY,
          JSON.stringify({
            ...checkoutSignature,
            url: data.url,
            donationId: data.donationId ?? null,
            claimToken: data.claimToken ?? null,
            wantsAccountAfterDonation,
            wantsSignInAfterDonation,
            createdAt: new Date().toISOString(),
          }),
        )
        window.location.href = data.url
        return
      }

      // 🔹 Branch 2: flujo antiguo (QR / otros)
      // Check if we already have a pending donation for QR payment
      if (donationId && selectedMethod === 'qr') {
        setShowQRStep(true)
        setIsSubmitting(false)
        return
      }

      // Create donation through our API
      const donationData = {
        campaignId: campaignId,
        amount: donationAmount,
        tipAmount: platformFee,
        paymentMethod: selectedMethod,
        message: '',
        isAnonymous: isDonationAnonymous,
        notificationEnabled: false,
        customAmount:
          !selectedAmount && customAmount ? true : false,
      }

      const response = await fetch('/api/donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(
          'Error submitting donation:',
          errorData.error,
        )

        // Check specifically for auth error
        if (
          errorData.error ===
          'User must be logged in for non-anonymous donations'
        ) {
          throw new Error(
            'Debes iniciar sesión para realizar donaciones. Por favor, inicia sesión o regístrate primero.',
          )
        }

        throw new Error(
          errorData.error || 'Error submitting donation',
        )
      }

      const data = await response.json()

      // Store donation ID for notification updates
      if (data && data.donationId) {
        setDonationId(data.donationId)

        // Store pending donation in localStorage for QR payments
        if (selectedMethod === 'qr') {
          const pendingDonation = {
            donationId: data.donationId,
            campaignId,
            amount: donationAmount,
            tipAmount: platformFee,
            paymentMethod: selectedMethod,
            qrAccessToken: data.qrAccessToken ?? null,
            claimToken: data.claimToken ?? null,
            wantsAccountAfterDonation,
            wantsSignInAfterDonation,
            createdAt: new Date().toISOString(),
          }
          if (data.claimToken) {
            setDonationClaimIntent({
              donationId: data.donationId,
              claimToken: data.claimToken,
              campaignId,
              createdAt: pendingDonation.createdAt,
            })
          }
          setQrAccessToken(data.qrAccessToken ?? null)
          localStorage.setItem(
            PENDING_DONATION_KEY,
            JSON.stringify(pendingDonation),
          )
        }
      }

      if (selectedMethod === 'qr') {
        setShowQRStep(true)
        setIsSubmitting(false)
        return
      }
    } catch (error) {
      console.error('Error submitting donation:', error)
      setInfoMessage(null)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error desconocido al enviar la donación',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle authentication error by redirecting to login
  const handleLoginRedirect = () => {
    // Store the current URL to redirect back after login
    const currentPath = window.location.pathname
    router.push(
      `/sign-in?redirect=${encodeURIComponent(currentPath)}`,
    )
  }

  // Handle closing success modal
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    router.push('/')
  }

  const handleCreateAccountAfterDonation = () => {
    const currentDonationId =
      donationId ||
      activeDonationIdRef.current ||
      activeDonationId
    const intent = currentDonationId
      ? getStoredDonationClaimIntent(currentDonationId)
      : donationClaimIntent

    if (intent) {
      saveDonationClaimIntent(intent)
    }

    router.push('/sign-up?donationClaim=1')
  }

  // Handle slider change for Minka contribution
  const handleMinkaContributionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setMinkaContribution(Number(e.target.value))
  }

  // Handle tip mode change
  const handleTipModeChange = (
    mode: 'percentage' | 'custom',
  ) => {
    setTipMode(mode)
    if (mode === 'custom' && !customTipAmount) {
      setCustomTipAmount('')
    }
  }

  // Handle custom tip amount change
  const handleCustomTipChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value
    // Only allow numbers and decimal point, max 2 decimal places
    if (/^\d*(\.\d{0,2})?$/.test(value)) {
      setCustomTipAmount(value)
    }
  }

  if (campaignLoading) {
    return <DonatePageLoading />
  }

  if (campaignError) {
    return (
      <div className='min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex items-center justify-center'>
        <div className='text-center px-4'>
          <div className='h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8 text-red-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </div>
          <h2 className='mt-4 text-lg font-medium text-gray-900'>
            Error
          </h2>
          <p className='mt-2 text-gray-600'>
            {campaignError}
          </p>
          <Button
            className='mt-6 bg-[#2c6e49] hover:bg-[#1e4d33] text-white'
            onClick={() => router.push('/all-campaigns')}
          >
            Ver otras campañas
          </Button>
        </div>
      </div>
    )
  }

  // Default values if campaign data isn't available
  const campaignTitle =
    campaign?.title ||
    'Nombre de la campaña sin especificar'

  const campaignImage =
    campaign?.media?.find((m: any) => m.is_primary)
      ?.media_url ||
    campaign?.media?.[0]?.media_url ||
    '/placeholder.svg'

  const organizer = {
    name:
      campaign?.organizer?.name || 'Nombre sin especificar',
    role: 'Organizador de campaña',
    location:
      formatRegionDisplayName(campaign?.location) ||
      formatRegionDisplayName(
        campaign?.organizer?.location,
      ) ||
      'Ubicación no especificada',
    profilePicture:
      campaign?.organizer?.profilePicture || null,
  }

  return (
    <div className='min-h-screen bg-gradient-to-r from-white to-[#f5f7e9]'>
      <Header />

      {/* Spacer div to account for the fixed header height */}
      <div className='h-20 md:h-28'></div>

      {/* Page header */}
      <div className='w-full h-[100px] md:h-[200px] lg:h-[300px] relative border-t border-[#2c6e49]/5'>
        <Image
          src='/page-header.svg'
          alt='Page Header'
          fill
          className='object-cover object-bottom'
          priority
        />
        <div className='absolute inset-0 flex items-center justify-center p-4'>
          <h1 className='text-4xl sm:text-6xl md:text-7xl lg:text-[90px] font-bold text-white text-center'>
            Impulsa sueños con tu donación
          </h1>
        </div>
      </div>

      {/* Campaign info header - updated to match design */}
      <div className='w-full py-10'>
        <div className='container mx-auto px-4'>
          <div className='max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6'>
            <div className='text-center md:text-left md:flex-1'>
              <h2 className='text-2xl md:text-3xl font-bold text-[#2c6e49] mb-4'>
                {campaignTitle}
              </h2>

              {/* Organizer details without background */}
              <div className='inline-flex items-center pl-1 pr-4 py-1'>
                <div className='w-8 h-8 rounded-full bg-[#2c6e49] flex-shrink-0 mr-2 overflow-hidden'>
                  {organizer.profilePicture ? (
                    <Image
                      src={organizer.profilePicture}
                      alt={organizer.name}
                      width={32}
                      height={32}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-white text-xs'>
                      {organizer.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className='flex flex-col'>
                  <span className='font-medium text-[#2c6e49]'>
                    {organizer.name}
                  </span>
                  <div className='flex text-xs text-gray-600'>
                    <span>
                      {organizer.role} |{' '}
                      {organizer.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className='md:flex-1'>
              <div className='rounded-lg overflow-hidden h-[180px] max-w-[400px] mx-auto'>
                <Image
                  src={campaignImage}
                  alt={campaignTitle}
                  width={400}
                  height={180}
                  className='w-full h-full object-cover'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator between campaign details and form */}
      <div className='w-full flex justify-center'>
        <div className='w-[90%] border-t border-gray-200'></div>
      </div>

      <main className='overflow-x-hidden'>
        <div className='container mx-auto py-12'>
          <div className='w-full max-w-3xl mx-auto px-4'>
            {showQRStep && donationId ? (
              <div className='min-h-[600px] flex items-center justify-center py-6'>
                <QRPaymentStep
                  key={donationId}
                  donationId={donationId}
                  qrAccessToken={qrAccessToken}
                  tipAmount={platformFee}
                  amount={totalAmount}
                  campaignId={campaignId}
                  onPaymentConfirmed={() => {
                    setShowQRStep(false)
                    setQrAccessToken(null)
                    finishSuccessfulDonation(donationId)
                  }}
                  onCancel={() => {
                    localStorage.removeItem(
                      PENDING_DONATION_KEY,
                    )
                    setDonationId(null)
                    setQrAccessToken(null)
                    setShowQRStep(false)
                  }}
                />
              </div>
            ) : (
              <div className='mb-8'>
                <section>
                  <h3 className='text-lg font-semibold text-black mb-4'>
                    Método de pago
                  </h3>
                  <div className='grid gap-4 md:grid-cols-2'>
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type='button'
                        className={`text-left rounded-lg p-5 border transition-colors ${
                          paymentMethod === method.id
                            ? 'border-[#2c6e49] bg-[#f5f7e9]'
                            : 'border-black hover:border-[#2c6e49] hover:bg-gray-50'
                        }`}
                        onClick={() =>
                          handlePaymentMethodSelect(
                            method.id,
                          )
                        }
                      >
                        <div className='flex items-start gap-4'>
                          <div className='mt-1 h-6 w-6 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0'>
                            {paymentMethod === method.id ? (
                              <div className='h-3 w-3 rounded-full bg-[#2c6e49]' />
                            ) : null}
                          </div>
                          <div className='flex-shrink-0 text-[#2c6e49]'>
                            {method.id === 'card' ? (
                              <CreditCard className='h-8 w-8' />
                            ) : (
                              <QrCode className='h-8 w-8 text-[#2c6e49]' />
                            )}
                          </div>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {method.id === 'card' ? (
                                <>
                                  Tarjeta de crédito/débito{' '}
                                  <strong>
                                    Internacional*
                                  </strong>
                                </>
                              ) : (
                                method.title
                              )}
                            </p>
                            <p className='text-sm text-gray-600 mt-1'>
                              {method.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section
                  className={`transition-[opacity,transform] duration-500 ease-out ${
                    paymentMethod
                      ? 'opacity-100 translate-y-0 mt-8'
                      : 'h-0 overflow-hidden opacity-0 translate-y-3 pointer-events-none'
                  }`}
                >
                  <div className='border-t border-gray-200 pt-8'>
                    <h3 className='text-lg font-semibold text-black mb-4'>
                      Monto de aporte
                    </h3>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                      {donationAmounts.map((option) => (
                        <button
                          key={option.value}
                          type='button'
                          className={`py-3 px-4 rounded-lg border ${
                            selectedAmount === option.value
                              ? 'border-[#2c6e49] bg-[#2c6e49] text-white'
                              : 'border-black hover:bg-gray-100 text-black'
                          } transition-colors`}
                          onClick={() =>
                            handleAmountSelect(option.value)
                          }
                        >
                          {currencyPrefix} {option.value}
                        </button>
                      ))}
                    </div>

                    <div className='relative mb-6'>
                      <div className='absolute inset-0 flex items-center'>
                        <div className='w-full border-t border-gray-300'></div>
                      </div>
                      <div className='relative flex justify-center'>
                        <span className='bg-white px-3 text-sm text-gray-500 font-medium'>
                          o
                        </span>
                      </div>
                    </div>

                    <div className='mb-8'>
                      <label
                        htmlFor='custom-amount'
                        className='block text-sm font-medium text-black mb-2'
                      >
                        Si prefieres, indica otra cantidad
                      </label>
                      <div className='relative'>
                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-black'>
                          {currencyPrefix}
                        </span>
                        <input
                          type='text'
                          id='custom-amount'
                          className='block w-full pl-10 pr-3 py-3 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black'
                          placeholder='0.00'
                          value={customAmount}
                          onChange={
                            handleCustomAmountChange
                          }
                        />
                      </div>

                      <p className='mt-6'>
                        <span className=' font-semibold'>
                          Importante:
                        </span>{' '}
                        El tipo de cambio no es el oficial,
                        sino el paralelo.
                      </p>
                    </div>

                    <div className='mt-16 mb-8'>
                      <p className='text-sm text-black mb-3'>
                        ¿Quieres también apoyar a Minka? La
                        contribución voluntaria es opcional
                        y ayuda a sostener la plataforma.
                      </p>

                      <div className='flex flex-wrap gap-2 mb-4'>
                        <button
                          type='button'
                          className={`px-3 py-1 text-sm rounded-md border ${
                            tipMode === 'percentage'
                              ? 'bg-[#2c6e49] text-white border-[#2c6e49]'
                              : 'bg-white text-black border-black hover:bg-gray-100'
                          } transition-colors`}
                          onClick={() =>
                            handleTipModeChange(
                              'percentage',
                            )
                          }
                        >
                          Porcentaje
                        </button>
                        <button
                          type='button'
                          className={`px-3 py-1 text-sm rounded-md border ${
                            tipMode === 'custom'
                              ? 'bg-[#2c6e49] text-white border-[#2c6e49]'
                              : 'bg-white text-black border-black hover:bg-gray-100'
                          } transition-colors`}
                          onClick={() =>
                            handleTipModeChange('custom')
                          }
                        >
                          Cantidad personalizada
                        </button>
                      </div>

                      {tipMode === 'percentage' && (
                        <div className='space-y-2'>
                          <div className='relative h-8'>
                            <div
                              className='absolute -top-2 transform -translate-x-1/2 text-[#2c6e49] text-lg font-semibold'
                              style={{
                                left: `${minkaContribution}%`,
                              }}
                            >
                              {minkaContribution}%
                            </div>
                          </div>
                          <input
                            type='range'
                            min='0'
                            max='100'
                            step='1'
                            value={minkaContribution}
                            onChange={
                              handleMinkaContributionChange
                            }
                            className='w-full h-2 cursor-pointer rounded-full appearance-none bg-gray-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2c6e49]'
                          />
                        </div>
                      )}

                      {tipMode === 'custom' && (
                        <div className='space-y-2'>
                          <label
                            htmlFor='custom-tip'
                            className='block text-sm font-medium text-black'
                          >
                            Ingresa el monto de tu
                            contribución
                          </label>
                          <div className='relative'>
                            <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-black'>
                              {currencyPrefix}
                            </span>
                            <input
                              type='text'
                              id='custom-tip'
                              className='block w-full pl-10 pr-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black'
                              placeholder='0.00'
                              value={customTipAmount}
                              onChange={
                                handleCustomTipChange
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className='border-t border-gray-200 pt-5 mb-6'>
                      <h3 className='text-lg font-semibold text-[#2c6e49] mb-3'>
                        Resumen
                      </h3>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between gap-4'>
                          <span className='text-gray-600'>
                            Método
                          </span>
                          <span className='font-medium text-right'>
                            {paymentMethod === 'qr'
                              ? 'Código QR'
                              : 'Tarjeta internacional'}
                          </span>
                        </div>
                        <div className='flex justify-between gap-4'>
                          <span className='text-gray-600'>
                            Donación
                          </span>
                          <span className='font-medium'>
                            {currencyPrefix}{' '}
                            {donationAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className='flex justify-between gap-4'>
                          <span className='text-gray-600'>
                            Tip a Minka
                          </span>
                          <span className='font-medium'>
                            {currencyPrefix}{' '}
                            {platformFee.toFixed(2)}
                          </span>
                        </div>
                        <div className='flex justify-between gap-4 border-t border-gray-200 pt-2 text-base'>
                          <span className='font-semibold'>
                            Total
                          </span>
                          <span className='font-semibold'>
                            {currencyPrefix}{' '}
                            {totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!user && (
                      <>
                        <div className='mb-6 rounded-lg border border-[#2c6e49]/25 bg-[#f5f7e9] p-4'>
                          <label
                            htmlFor='create-account-after-donation'
                            className='flex items-start gap-3 cursor-pointer'
                          >
                            <Checkbox
                              id='create-account-after-donation'
                              checked={
                                wantsAccountAfterDonation
                              }
                              onCheckedChange={(
                                checked,
                              ) => {
                                const isChecked =
                                  checked === true
                                setWantsAccountAfterDonation(
                                  isChecked,
                                )
                                if (isChecked) {
                                  setWantsSignInAfterDonation(
                                    false,
                                  )
                                }
                              }}
                              className='mt-1'
                            />
                            <span className='text-sm text-gray-800'>
                              <span className='font-semibold text-[#2c6e49]'>
                                ¿Quieres que tu nombre salga
                                luego de donar?
                              </span>{' '}
                              Crea tu cuenta después de
                              pagar para vincular esta
                              donación y aparecer en últimos
                              donadores. También podrás ver
                              tu historial, guardar
                              favoritas y recibir
                              notificaciones.
                            </span>
                          </label>
                        </div>
                        <div className='mb-6 rounded-lg border border-[#2c6e49]/25 bg-[#f5f7e9] p-4'>
                          {' '}
                          <label
                            htmlFor='sign-in-after-donation'
                            className='flex items-start gap-3 cursor-pointer'
                          >
                            <Checkbox
                              id='sign-in-after-donation'
                              checked={
                                wantsSignInAfterDonation
                              }
                              onCheckedChange={(
                                checked,
                              ) => {
                                const isChecked =
                                  checked === true
                                setWantsSignInAfterDonation(
                                  isChecked,
                                )
                                if (isChecked) {
                                  setWantsAccountAfterDonation(
                                    false,
                                  )
                                }
                              }}
                              className='mt-1'
                            />
                            <span className='text-sm text-gray-800'>
                              <span className='font-semibold text-[#2c6e49]'>
                                Ya tengo cuenta
                              </span>
                            </span>
                          </label>
                        </div>
                      </>
                    )}

                    {user && (
                      <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4'>
                        <label
                          htmlFor='anonymous-donation'
                          className='flex items-start gap-3 cursor-pointer'
                        >
                          <Checkbox
                            id='anonymous-donation'
                            checked={wantsAnonymousDonation}
                            onCheckedChange={(checked) =>
                              setWantsAnonymousDonation(
                                checked === true,
                              )
                            }
                            className='mt-1'
                          />
                          <span className='text-sm text-gray-800'>
                            <span className='font-semibold text-[#2c6e49]'>
                              Hacer mi donación anónima
                            </span>{' '}
                            Tu nombre no aparecerá
                            públicamente en esta donación.
                          </span>
                        </label>
                        {wantsAnonymousDonation && (
                          <p className='mt-2 pl-8 text-xs text-gray-500'>
                            Dejar tu apoyo con tu nombre
                            ayuda a dar confianza al
                            organizador y a otros donantes.
                          </p>
                        )}
                      </div>
                    )}

                    {errorMessage && (
                      <div className='bg-red-50 border border-red-300 text-red-800 rounded-lg p-4 mb-4'>
                        <p className='text-sm'>
                          {errorMessage}
                        </p>
                        {errorMessage.includes(
                          'iniciar sesión',
                        ) && (
                          <Button
                            className='mt-2 bg-white border border-red-300 text-red-700 hover:bg-red-50'
                            onClick={handleLoginRedirect}
                          >
                            Iniciar sesión
                          </Button>
                        )}
                      </div>
                    )}

                    {infoMessage && (
                      <div className='bg-blue-50 border border-blue-300 text-blue-800 rounded-lg p-4 mb-4'>
                        <p className='text-sm'>
                          {infoMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <div className='mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between'>
                  <Button
                    type='button'
                    variant='outline'
                    className='rounded-full border-[#2c6e49] text-[#2c6e49] hover:bg-[#e8f0e9]'
                    onClick={() =>
                      router.push(`/campaign/${campaignId}`)
                    }
                    disabled={isSubmitting}
                  >
                    Volver
                  </Button>

                  {paymentMethod && reviewState ? (
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <Button
                        className='bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-8 py-3 rounded-full'
                        onClick={() => {
                          const id =
                            activeDonationIdRef.current ||
                            activeDonationId
                          if (id) pollDonationStatus(id)
                        }}
                        disabled={isSubmitting}
                      >
                        Revisar Estado{' '}
                        <ArrowUp className='ml-2 h-4 w-4' />
                      </Button>
                      <Button
                        className='bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-8 py-3 rounded-full'
                        onClick={() => {
                          activeDonationIdRef.current = null
                          setActiveDonationId(null)
                          setDonationId(null)
                          window.history.replaceState(
                            {},
                            '',
                            window.location.pathname,
                          )
                          handleConfirmDonation()
                        }}
                        disabled={isSubmitting}
                      >
                        Nuevo intento{' '}
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Button>
                    </div>
                  ) : paymentMethod ? (
                    <Button
                      className='bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-8 py-3 rounded-full'
                      onClick={handleConfirmDonation}
                      disabled={
                        !isPaymentFormReady || isSubmitting
                      }
                    >
                      {isSubmitting
                        ? paymentMethod === 'card'
                          ? 'Redirigiendo...'
                          : 'Generando QR...'
                        : paymentMethod === 'card'
                          ? 'Pagar con tarjeta'
                          : 'Generar QR'}
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className='fixed inset-0 bg-gray-800/75 z-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full relative shadow-xl'>
            {/* Darker header with X button */}
            <div className='bg-[#FCF9ED] p-3 flex justify-end'>
              <button
                className='text-gray-500 hover:text-gray-700'
                onClick={handleCloseSuccessModal}
              >
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M18 6L6 18M6 6L18 18'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </button>
            </div>

            {/* Content area with cream background */}
            <div className='bg-[#FFFDF7] text-center p-8'>
              {/* Heart icon from SVG */}
              <div className='mx-auto flex justify-center'>
                <Image
                  src='/icons/heart.svg'
                  alt='Heart'
                  width={48}
                  height={48}
                  priority
                />
              </div>

              <h3 className='mt-3 text-xl font-bold text-gray-900'>
                ¡Gracias por ser parte del cambio!
              </h3>

              <p className='mt-2 text-sm text-gray-600'>
                Tu aporte ayuda a construir un futuro mejor.
              </p>

              <p className='mt-1 text-sm text-gray-600'>
                ¡Juntos somos más fuertes!
              </p>

              {/* Account creation prompt for unauthenticated users */}
              {!user && (
                <p className='mt-3 text-sm text-[#2c6e49] font-medium'>
                  Crea una cuenta para dejar tu nombre en la
                  donación que hiciste y seguir el impacto
                </p>
              )}

              {!user && (
                <button
                  type='button'
                  className='mt-4 w-full inline-flex justify-center border-0 bg-[#2c6e49] px-6 py-2 text-sm font-medium text-white hover:bg-[#1e4d33] focus:outline-none rounded-full'
                  onClick={handleCreateAccountAfterDonation}
                >
                  Crear mi cuenta
                </button>
              )}

              {!user && (
                <div className='mt-5 rounded-lg bg-[#f5f7e9] p-4 text-left'>
                  <p className='text-sm font-semibold text-[#2c6e49]'>
                    Haz que tu ayuda tenga más historia.
                  </p>
                  <p className='mt-1 text-sm text-gray-700'>
                    Crear una cuenta permite dejar tu nombre
                    si lo deseas en las donaciones, puedes
                    también dejar mensajes de apoyo a la
                    causa, guardar tus campañas favoritas,
                    revisar tu historial de donaciones,
                    volver fácilmente para ver
                    actualizaciones cuando quieras y toma
                    pocos segundos.
                  </p>
                </div>
              )}

              <div className='border-t border-black my-4'></div>

              <div className='space-y-2'>
                {/* Share section */}
                <CampaignShareMenu
                  campaign={{
                    id: campaignId,
                    title: campaign?.title,
                    subtitle: campaign?.subtitle,
                    description: campaign?.description,
                    imageUrl: campaignImage,
                  }}
                  intent='donation'
                  buttonLabel='Compartir campaña'
                  triggerClassName='w-full inline-flex justify-center px-6 py-2 text-sm font-medium text-[#2c6e49] hover:text-[#1e4d33] border border-[#2c6e49] hover:border-[#1e4d33] rounded-full transition-colors'
                  dropdownClassName='left-1/2 -translate-x-1/2 w-64'
                />

                <button
                  type='button'
                  className='w-full inline-flex justify-center border border-[#2c6e49] bg-white px-6 py-2 text-sm font-medium text-[#2c6e49] hover:bg-[#f5f7e9] focus:outline-none rounded-full'
                  onClick={() =>
                    router.push('/all-campaigns')
                  }
                >
                  Explorar otras
                </button>

                <button
                  type='button'
                  className='block mx-auto text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none transition-colors'
                  onClick={handleCloseSuccessModal}
                >
                  Ir al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Loading fallback component
export function DonatePageLoading() {
  return (
    <div className='min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex items-center justify-center'>
      <div className='text-center'>
        <LoadingSpinner
          size='lg'
          showText={true}
          text='Cargando...'
        />
      </div>
    </div>
  )
}
