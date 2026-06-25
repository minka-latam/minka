'use client'

import Link from 'next/link'
import { Mail, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { landingPrimaryButton } from './landing-button-styles'

const contactEmail = 'info@minka-comunidad.org'

const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
  'Solicitud para registrar institución aprobada en Minka',
)}&body=${encodeURIComponent(
  [
    'Hola Minka,',
    '',
    'Quisiera solicitar que mi institución sea evaluada para figurar como institución aprobada en Minka.',
    '',
    'Datos de la institución:',
    '- Nombre legal:',
    '- NIT o número de registro:',
    '- Forma legal:',
    '- Ciudad y departamento:',
    '- Persona de contacto:',
    '- Teléfono:',
    '- Correo:',
    '- Sitio web o redes sociales:',
    '- Breve descripción de la institución:',
    '',
    'Adjunto la documentación disponible para su revisión.',
  ].join('\n'),
)}`

const requirements = [
  'Nombre legal de la institución, fundación, asociación u organización.',
  'NIT, número de registro o documento equivalente, si corresponde.',
  'Forma legal, ubicación y datos de contacto institucionales.',
  'Nombre, cargo, teléfono y correo de una persona de contacto.',
  'Sitio web, redes sociales o referencias públicas disponibles.',
  'Algún documento que respalde la existencia y actividad de la institución.',
]

type InstitutionReviewDialogProps = {
  trigger: ReactNode
}

export function InstitutionReviewDialog({
  trigger,
}: InstitutionReviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl text-[#333333]'>
            <ShieldCheck className='h-6 w-6 text-[#2c6e49]' />
            Solicitar revisión institucional
          </DialogTitle>
          <DialogDescription className='pt-2 text-base leading-7'>
            Este proceso es manual. No es necesario para
            crear una campaña, pero puede ayudar cuando una
            campaña representa a una institución, fundación,
            asociación u organización formal.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#2c6e49]'>
              Qué revisaríamos
            </h3>
            <p className='mt-2 text-sm leading-6 text-gray-600'>
              Revisamos que la institución exista, que la
              información sea coherente y que podamos
              registrar datos básicos para uso administrativo
              de Minka. La aprobación no garantiza el éxito
              de una campaña ni reemplaza la verificación de
              una causa específica.
            </p>
          </div>

          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-[#2c6e49]'>
              Información sugerida
            </h3>
            <ul className='mt-3 space-y-2 text-sm leading-6 text-gray-600'>
              {requirements.map((requirement) => (
                <li key={requirement} className='flex gap-2'>
                  <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2c6e49]' />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className='rounded-xl bg-[#f3f8ef] p-4 text-sm leading-6 text-[#33443a]'>
            Los datos enviados se usan para revisión interna
            y administración. Si falta información,
            responderemos por correo solicitando los detalles
            necesarios.
          </div>
        </div>

        <DialogFooter className='gap-3 sm:justify-between sm:space-x-0'>
          <p className='text-sm text-muted-foreground'>
            Escríbenos a{' '}
            <Link
              href={`mailto:${contactEmail}`}
              target='_blank'
              rel='noreferrer'
              className='font-medium text-[#2c6e49] underline-offset-4 hover:underline'
            >
              {contactEmail}
            </Link>
          </p>
          <Button asChild className={landingPrimaryButton}>
            <Link
              href={mailtoHref}
              target='_blank'
              rel='noreferrer'
            >
              Enviar solicitud
              <Mail className='h-4 w-4' />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
