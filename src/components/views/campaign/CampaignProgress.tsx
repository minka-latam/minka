'use client'

import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSavedCampaigns } from '@/hooks/use-saved-campaigns'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  SAVED_CAMPAIGN_IDS_CACHE_KEY,
  SAVED_CAMPAIGNS_UPDATED_EVENT,
  SAVE_CAMPAIGN_INTENT_KEY,
  SAVE_CAMPAIGN_INTENT_UPDATED_EVENT,
} from '@/constants/saved-campaign'
import { CampaignShareMenu } from '@/components/share/CampaignShareMenu'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CampaignProgressProps {
  isVerified: boolean
  createdAt: string
  currentAmount: number
  targetAmount: number
  donorsCount: number
  daysRemaining?: number
  campaignTitle?: string
  campaignSubtitle?: string
  campaignDescription?: string
  campaignImageUrl?: string
  campaignOrganizer?: string
  campaignLocation?: string
  campaignStatus?: string
  campaignId?: string
  latestDonors?: Array<{
    id: string
    name: string
    amount: number
    isAnonymous?: boolean
  }>
}

// Function to calculate relative time
function getRelativeTime(dateString: string): string {
  const now = new Date()
  const createdDate = new Date(dateString)
  const diffTime = Math.abs(
    now.getTime() - createdDate.getTime(),
  )
  const diffDays = Math.floor(
    diffTime / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) {
    return 'hoy'
  } else if (diffDays === 1) {
    return '1 día'
  } else if (diffDays < 30) {
    return `${diffDays} días`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? '1 mes' : `${months} meses`
  } else {
    const years = Math.floor(diffDays / 365)
    return years === 1 ? '1 año' : `${years} años`
  }
}

export function CampaignProgress({
  isVerified,
  createdAt,
  currentAmount,
  targetAmount,
  donorsCount,
  daysRemaining = 0,
  campaignTitle = '',
  campaignSubtitle = '',
  campaignDescription = '',
  campaignImageUrl = '',
  campaignOrganizer = '',
  campaignLocation = '',
  campaignStatus = '',
  campaignId = '',
  latestDonors = [],
}: CampaignProgressProps) {
  const { session, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { isCampaignSaved, saveCampaign, unsaveCampaign } =
    useSavedCampaigns()
  const [isSaving, setIsSaving] = useState(false)
  const [isSessionLoaded, setIsSessionLoaded] =
    useState(false)
  const [hasPendingSaveIntent, setHasPendingSaveIntent] =
    useState(false)
  const [cachedIsSaved, setCachedIsSaved] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const rawIds = localStorage.getItem(
        SAVED_CAMPAIGN_IDS_CACHE_KEY,
      )
      if (!rawIds) return false
      const ids = JSON.parse(rawIds) as string[]
      return Array.isArray(ids) && ids.includes(campaignId)
    } catch {
      return false
    }
  })
  const router = useRouter()

  const isLoggedIn = !!session
  const isDraftCampaign = campaignStatus === 'draft'
  const draftTooltip = "Tu campaña sigue en 'borrador'"
  const isSaved = isCampaignSaved(campaignId)
  const effectiveIsSaved =
    isSaved || cachedIsSaved || hasPendingSaveIntent

  // Debug component state
  useEffect(() => {}, [
    campaignId,
    session,
    isLoggedIn,
    authLoading,
    isSaved,
  ])

  // Debug session state
  useEffect(() => {
    if (!authLoading) {
      setIsSessionLoaded(true)
    }
  }, [session, authLoading, isLoggedIn, campaignId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncClientState = () => {
      try {
        const rawIntent = sessionStorage.getItem(
          SAVE_CAMPAIGN_INTENT_KEY,
        )
        if (!rawIntent) {
          setHasPendingSaveIntent(false)
        } else {
          const parsedIntent = JSON.parse(rawIntent) as {
            campaignId?: string
          }
          setHasPendingSaveIntent(
            parsedIntent?.campaignId === campaignId,
          )
        }

        const rawIds = localStorage.getItem(
          SAVED_CAMPAIGN_IDS_CACHE_KEY,
        )
        if (!rawIds) {
          setCachedIsSaved(false)
        } else {
          const ids = JSON.parse(rawIds) as string[]
          setCachedIsSaved(
            Array.isArray(ids) && ids.includes(campaignId),
          )
        }
      } catch (intentError) {
        console.error(
          'Error reading save campaign intent:',
          intentError,
        )
        setHasPendingSaveIntent(false)
        setCachedIsSaved(false)
      }
    }

    syncClientState()
    window.addEventListener(
      SAVE_CAMPAIGN_INTENT_UPDATED_EVENT,
      syncClientState,
    )
    window.addEventListener(
      SAVED_CAMPAIGNS_UPDATED_EVENT,
      syncClientState,
    )

    return () => {
      window.removeEventListener(
        SAVE_CAMPAIGN_INTENT_UPDATED_EVENT,
        syncClientState,
      )
      window.removeEventListener(
        SAVED_CAMPAIGNS_UPDATED_EVENT,
        syncClientState,
      )
    }
  }, [campaignId])

  const safeCurrentAmount = currentAmount || 0
  const safeTargetAmount = targetAmount || 1
  const progress =
    safeTargetAmount > 0
      ? Math.min(
          (safeCurrentAmount / safeTargetAmount) * 100,
          100,
        )
      : 0

  const handleSaveToggle = async () => {
    // Don't proceed until auth is confirmed loaded
    if (authLoading) {
      toast({
        title: 'Cargando',
        description:
          'Por favor espera mientras verificamos tu sesión',
      })
      return
    }

    if (!isLoggedIn) {
      try {
        sessionStorage.setItem(
          SAVE_CAMPAIGN_INTENT_KEY,
          JSON.stringify({
            campaignId,
            createdAt: Date.now(),
          }),
        )
        window.dispatchEvent(
          new Event(SAVE_CAMPAIGN_INTENT_UPDATED_EVENT),
        )
      } catch (storageError) {
        console.error(
          'Error storing save campaign intent:',
          storageError,
        )
      }
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : `/campaign/${campaignId}`
      router.push(
        `/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`,
      )
      return
    }

    // Validate campaign ID
    if (!campaignId || campaignId.trim() === '') {
      console.error(
        'Campaign ID is missing or empty:',
        campaignId,
      )
      toast({
        title: 'Error',
        description:
          'ID de campaña no válido. Por favor recarga la página',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      if (effectiveIsSaved) {
        const result = await unsaveCampaign(campaignId)
        if (result) {
        }
      } else {
        const result = await saveCampaign(campaignId)
        if (result) {
        }
      }
    } catch (error) {
      console.error('Error toggling saved state:', error)
      toast({
        title: 'Error',
        description:
          'No se pudo completar la operación. Por favor intenta nuevamente',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const displayedDonors: Array<{
    id: string
    name: string
    amount: number
  }> = []

  const isAnonymousDonor = (
    donor: (typeof latestDonors)[number],
  ) => {
    const normalizedName = donor.name.toLowerCase().trim()

    return (
      donor.isAnonymous ||
      normalizedName === 'donante anónimo' ||
      normalizedName === 'anonymous' ||
      normalizedName === 'anónimo' ||
      normalizedName.includes('anonym') ||
      normalizedName.includes('anónim')
    )
  }

  const uniqueNamedDonors: typeof latestDonors = []
  const seenNames = new Set<string>()

  latestDonors.forEach((donor) => {
    if (isAnonymousDonor(donor)) return

    const normalizedName = donor.name.trim().toLowerCase()
    if (!normalizedName || seenNames.has(normalizedName)) return

    seenNames.add(normalizedName)
    uniqueNamedDonors.push(donor)
  })

  const anonymousDonationsSeen = latestDonors.filter(
    isAnonymousDonor,
  ).length
  const anonymousAvailable = Math.max(
    anonymousDonationsSeen,
    donorsCount - uniqueNamedDonors.length,
  )
  let anonymousUsed = 0
  let nextNamedIndex = 0

  const pushNamed = () => {
    const donor = uniqueNamedDonors[nextNamedIndex]
    if (!donor) return

    displayedDonors.push(donor)
    nextNamedIndex += 1
  }

  const pushAnonymous = () => {
    if (anonymousUsed >= anonymousAvailable) return

    displayedDonors.push({
      id: `anonymous-${anonymousUsed}`,
      name: 'Donante anónimo',
      amount: 0,
    })
    anonymousUsed += 1
  }

  const totalItemsToDisplay = Math.min(donorsCount, 5)

  pushNamed()
  if (displayedDonors.length < totalItemsToDisplay) pushAnonymous()

  while (
    nextNamedIndex < uniqueNamedDonors.length &&
    displayedDonors.length < Math.min(totalItemsToDisplay, 4)
  ) {
    pushNamed()
  }

  if (displayedDonors.length < totalItemsToDisplay) pushAnonymous()

  while (
    nextNamedIndex < uniqueNamedDonors.length &&
    displayedDonors.length < totalItemsToDisplay
  ) {
    pushNamed()
  }

  while (
    displayedDonors.length < totalItemsToDisplay &&
    anonymousUsed < anonymousAvailable
  ) {
    pushAnonymous()
  }

  return (
    <div
      className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm relative'
      id='campaign-progress'
    >
      {/* Centered title - increased size */}
      <h2 className='text-2xl font-semibold text-[#2c6e49] mb-1 text-center'>
        Avances de la campaña
      </h2>

      {/* Verified and Created Date - Left and Right aligned */}
      <div className='flex justify-between items-center mb-4'>
        {isVerified && (
          <div className='flex items-center gap-2'>
            <VerifiedBadge
              size={24}
              className='h-6 w-6'
            />
            <span className='text-sm'>
              Campaña verificada
            </span>
          </div>
        )}
        <div className='flex items-center gap-2'>
          <Image
            src='/icons/schedule.svg'
            alt='Schedule'
            width={24}
            height={24}
          />
          <span className='text-sm'>
            {getRelativeTime(createdAt) === 'hoy'
              ? 'Creada hoy'
              : `Creada hace ${getRelativeTime(createdAt)}`}
          </span>
        </div>
      </div>

      {/* First separator */}
      <hr className='h-px w-full bg-gray-200 my-4' />

      <div className='space-y-4 mb-4'>
        <div className='flex justify-between text-sm'>
          <span className='text-[#2c6e49] font-medium'>
            Recaudado Bs.{' '}
            {(currentAmount || 0).toLocaleString()}
          </span>
          <span className='text-[#2c6e49] font-medium'>
            {donorsCount || 0} donadores
          </span>
        </div>
        <div className='flex items-center gap-3'>
          <div className='h-2 flex-1 bg-gray-100 rounded-full overflow-hidden'>
            <div
              className='h-full bg-[#2c6e49] rounded-full'
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className='text-lg font-bold text-[#2c6e49] min-w-[60px]'>
            {Math.round(progress)}%
          </span>
        </div>
        <div className='flex justify-between text-sm'>
          <span className='text-[#2c6e49] font-medium'>
            Objetivo de recaudación
          </span>
          <span className='text-[#2c6e49] font-medium'>
            Bs. {(targetAmount || 0).toLocaleString()}
          </span>
        </div>
        <div className='flex justify-between text-sm'>
          <span className='text-[#2c6e49] font-medium'>
            Días restantes
          </span>
          <span className='text-[#2c6e49] font-medium'>
            {Math.max(0, daysRemaining)}
          </span>
        </div>
      </div>

      {/* Second separator */}
      <hr className='h-px w-full bg-gray-200 my-4' />

      <div className='space-y-3'>
        {isDraftCampaign ? (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='block cursor-not-allowed'>
                  <Button
                    disabled
                    className='w-full cursor-not-allowed rounded-full bg-gray-200 py-6 text-gray-500 hover:bg-gray-200'
                  >
                    Donar ahora
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {draftTooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Link href={`/donate/${campaignId}`}>
            <Button className='w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full py-6'>
              Donar ahora
            </Button>
          </Link>
        )}

        <div className='flex w-full'>
          <CampaignShareMenu
            campaign={{
              id: campaignId,
              title: campaignTitle,
              subtitle: campaignSubtitle,
              description: campaignDescription,
              imageUrl: campaignImageUrl,
            }}
            disabled={isDraftCampaign}
            disabledReason={draftTooltip}
            triggerClassName='w-full border-[#2c6e49] hover:bg-gray-50 rounded-full py-6 text-[#2c6e49]'
            dropdownClassName='left-0 right-0'
          />
        </div>

        <Button
          variant='ghost'
          className='mx-auto flex w-fit hover:bg-gray-50 rounded-full px-5 py-5 text-[#2c6e49]'
          onClick={handleSaveToggle}
          disabled={
            isSaving || authLoading || hasPendingSaveIntent
          }
        >
          {hasPendingSaveIntent
            ? 'Guardando campaña...'
            : effectiveIsSaved
              ? 'Campaña guardada'
              : 'Guardar campaña'}
          {authLoading && ' (cargando...)'}
          {effectiveIsSaved ? (
            <BookmarkCheck className='ml-2 h-4 w-4 text-[#2c6e49]' />
          ) : (
            <Bookmark className='ml-2 h-4 w-4 text-[#2c6e49]' />
          )}
        </Button>

        {displayedDonors.length > 0 && (
          <div className='border-t border-gray-200 pt-4 text-left'>
            <h3 className='mb-2 text-sm font-semibold text-[#2c6e49]'>
              Últimos donadores
            </h3>
            <ul className='space-y-1 text-[12.5px] leading-relaxed text-gray-600'>
              {displayedDonors.map((donor) => (
                <li key={donor.id}>
                  <span className='truncate'>
                    {donor.name}
                  </span>
                </li>
              ))}
            </ul>
            <p className='mt-2 text-[12.5px] text-gray-500 italic'>
              {donorsCount > 5
                ? '...y muchos más, ¿tú?'
                : '¡Tú también puedes apoyar!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
