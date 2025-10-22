'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'

interface Category {
  id: string
  name: string
  nameRw?: string | null
}

interface MenuItem {
  id: string
  name: string
  nameRw?: string | null
  description?: string | null
  descriptionRw?: string | null
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  categoryId: string
}

interface MenuItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem | null
  categories: Category[]
  onSave: (itemData: any) => Promise<void>
  onDelete?: (itemId: string) => Promise<void>
}

export default function MenuItemModal({
  isOpen,
  onClose,
  item,
  categories,
  onSave,
  onDelete,
}: MenuItemModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Edit mode - pre-fill form
        setName(item.name || '')
        setDescription(item.description || '')
        setCategoryId(item.categoryId || '')
        setPrice(item.price.toString())
        setImageUrl(item.imageUrl || null)
        setIsAvailable(item.isAvailable)
      } else {
        // Create mode - clear form
        setName('')
        setDescription('')
        setCategoryId(categories.length > 0 ? categories[0].id : '')
        setPrice('')
        setImageUrl(null)
        setIsAvailable(true)
      }
      setError('')
      setShowDeleteConfirm(false)
    }
  }, [isOpen, item, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Item name is required')
      return
    }

    if (!categoryId) {
      setError('Category is required')
      return
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be greater than 0')
      return
    }

    setLoading(true)

    try {
      await onSave({
        name: trimmedName,
        description: description.trim() || undefined,
        categoryId,
        price: priceNum,
        imageUrl: imageUrl || undefined,
        isAvailable,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save menu item')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!item || !onDelete) return

    setLoading(true)
    try {
      await onDelete(item.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete menu item')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onClose()
    }
  }

  const categoryOptions = categories.length > 0
    ? categories.map(cat => ({ value: cat.id, label: cat.name }))
    : [{ value: '', label: 'No categories available' }]

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={item ? 'Edit Menu Item' : 'Add Menu Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Grilled Chicken"
            required
            disabled={loading}
          />

          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            disabled={loading}
          />

          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoryOptions}
            required
            disabled={loading || categories.length === 0}
          />

          <Input
            label="Price (RWF)"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g., 5000"
            required
            disabled={loading}
          />

          <ImageUpload
            label="Item Image"
            folder="menu-items"
            currentImage={imageUrl}
            onUploadComplete={(url) => setImageUrl(url)}
            onRemove={() => setImageUrl(null)}
            aspectRatio="square"
          />

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">
              Available for ordering
            </label>
          </div>

          {error && (
            <p className="text-sm text-status-error">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={loading}
              fullWidth
            >
              Cancel
            </Button>

            {item && onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                fullWidth
              >
                Delete
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || categories.length === 0}
              fullWidth
            >
              Save Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !loading && setShowDeleteConfirm(false)}
        title="Delete Menu Item?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently remove the item from your menu.
          </p>

          {error && (
            <p className="text-sm text-status-error">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
              fullWidth
            >
              Go Back
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={loading}
              disabled={loading}
              fullWidth
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
