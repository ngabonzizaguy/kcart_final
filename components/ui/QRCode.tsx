'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  includeMargin?: boolean
}

export default function QRCode({
  value,
  size = 256,
  level = 'H',
  includeMargin = true,
}: QRCodeProps) {
  return (
    <div className="flex items-center justify-center">
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
        className="border-4 border-white shadow-lg rounded-xl"
      />
    </div>
  )
}
