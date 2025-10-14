'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import ImageUpload from '@/components/ui/ImageUpload'
import { useToast } from '@/components/ui/Toast'

export default function MediaPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [coverUrl, setCoverUrl] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/vendor/onboarding/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl, coverUrl }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save media')
      }

      showToast({
        type: 'success',
        message: 'Media saved!',
      })

      router.push('/onboarding/location')
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/location')
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-orange bg-clip-text text-transparent mb-2">
            DeliGo
          </h1>
          <div className="text-sm text-gray-500 mb-4">Step 2 of 4</div>
        </div>
        <CardTitle>Business Media</CardTitle>
        <CardDescription>
          Add images to make your storefront stand out
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <ImageUpload
          label="Logo"
          folder="logos"
          currentImage={logoUrl}
          aspectRatio="square"
          onUploadComplete={(url) => setLogoUrl(url)}
          onRemove={() => setLogoUrl('')}
        />

        <ImageUpload
          label="Cover Image"
          folder="covers"
          currentImage={coverUrl}
          aspectRatio="cover"
          onUploadComplete={(url) => setCoverUrl(url)}
          onRemove={() => setCoverUrl('')}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Continue
          </Button>
        </div>
      </form>
    </Card>
  )
}
