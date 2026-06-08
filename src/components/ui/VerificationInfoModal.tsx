'use client'

import { X } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

interface VerificationInfoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
}

export function VerificationInfoModal({
  isOpen,
  onClose,
  title,
  content,
}: VerificationInfoModalProps) {
  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className='flex items-center justify-between border-b border-gray-200 pb-3'>
          <Image
            src='/landing-page/step-2.png'
            alt='Verified'
            width={32}
            height={32}
            className='text-[#2c6e49] flex-shrink-0'
          />

          <h2 className='text-xl font-semibold text-[#2c6e49]'>
            {title}
          </h2>

          <button
            onClick={onClose}
            className='rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2c6e49]'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Modal Content */}
        <div className='mt-4'>
          <p className='text-base text-gray-700 whitespace-pre-wrap leading-relaxed'>
            {content}
          </p>
        </div>
      </div>
    </div>
  )
}
