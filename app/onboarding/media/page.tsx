'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import ImageUpload from '@/components/ui/ImageUpload'
import { useToast } from '@/components/ui/Toast'

const MAX_COVER_IMAGES = 3

export default function MediaPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [coverUrls, setCoverUrls] = useState<string[]>([])

  const handleAddCover = (url: string) => {
    if (coverUrls.length >= MAX_COVER_IMAGES) {
      showToast({
        type: 'error',
        title: 'Limit Reached',
        message: `You can only upload up to ${MAX_COVER_IMAGES} cover images`,
      })
      return
    }
    setCoverUrls([...coverUrls, url])
  }

  const handleRemoveCover = (index: number) => {
    setCoverUrls(coverUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/vendor/onboarding/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl,
          coverUrl: coverUrls[0] || null, // Primary cover
          coverUrls, // All covers for carousel
        }),
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
        {/* Logo Upload */}
        <ImageUpload
          label="Logo"
          folder="logos"
          currentImage={logoUrl}
          aspectRatio="square"
          onUploadComplete={(url) => setLogoUrl(url)}
          onRemove={() => setLogoUrl('')}
        />

        {/* Cover Images Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Images (Up to {MAX_COVER_IMAGES})
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Upload up to {MAX_COVER_IMAGES} cover images. They'll display as a carousel on your storefront.
          </p>

          {/* Cover Previews */}
          {coverUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {coverUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200"
                >
                  <img
                    src={url}
                    alt={`Cover ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCover(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload New Cover */}
          {coverUrls.length < MAX_COVER_IMAGES && (
            <ImageUpload
              label={`Add Cover Image ${coverUrls.length > 0 ? `(${coverUrls.length}/${MAX_COVER_IMAGES})` : ''}`}
              folder="covers"
              currentImage=""
              aspectRatio="cover"
              onUploadComplete={handleAddCover}
              onRemove={() => {}}
            />
          )}

          {coverUrls.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">No cover images yet</p>
              <p className="text-xs text-gray-500">Upload your first cover image above</p>
            </div>
          )}
        </div>

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
