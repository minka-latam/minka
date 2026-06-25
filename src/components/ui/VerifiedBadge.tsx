'use client'

import Image from 'next/image'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type VerifiedBadgeProps = {
  className?: string
  iconClassName?: string
  size?: number
  tooltip?: string
}

export function VerifiedBadge({
  className,
  iconClassName,
  size = 32,
  tooltip = 'Campaña verificada por Minka con revisión de información y documentación de respaldo.',
}: VerifiedBadgeProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex shrink-0 items-center justify-center',
              className,
            )}
            aria-label='Campaña verificada'
          >
            <Image
              src='/landing-page/step-2.png'
              alt=''
              width={size}
              height={size}
              className={cn(
                'h-full w-full object-contain',
                iconClassName,
              )}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side='top'
          sideOffset={7}
          className='max-w-[240px] bg-[#2c6e49] text-white font-bold'
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
