'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { landingPrimaryButton } from './landing-button-styles'
import { InstitutionReviewDialog } from './InstitutionReviewDialog'

export function InstitutionInviteSection() {
  return (
    <section className='container mx-auto px-4 py-18'>
      <div className='container mx-auto'>
        <div className='mx-auto flex flex-col-reverse items-center gap-8 md:flex-row md:gap-12 lg:gap-16'>
          <div className='w-full max-w-sm shrink-0 md:w-[42%] md:max-w-md'>
            <Image
              src='/landing-page/vet.png'
              alt='Veterinaria junto a una mascota'
              width={1024}
              height={1024}
              className='h-auto w-full object-contain'
            />
          </div>

          <div className='w-full text-center md:text-start md:w-[70%]'>
            <p className='mb-2 text-sm font-semibold uppercase tracking-wide text-[#2c6e49]'>
              Instituciones aprobadas
            </p>
            <h2 className='text-3xl font-bold leading-tight text-[#333333] md:text-4xl'>
              ¿Representas a una institución que quiere
              aparecer en Minka?
            </h2>
            <p className='mt-4 text-base leading-7 text-[#555555] md:text-lg'>
              Cualquier persona individual puede crear una campaña para si mism@, otra persona o institución. Sin embargo podemos revisar organizaciones legalmente
              constituidas para sumarlas a nuestra base de
              instituciones aprobadas y dar más confianza a
              futuras campañas institucionales.
            </p>

            <InstitutionReviewDialog
              trigger={
                <Button className={`${landingPrimaryButton} mt-6`}>
                  Ver requisitos
                  <ArrowRight className='h-4 w-4' />
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}
