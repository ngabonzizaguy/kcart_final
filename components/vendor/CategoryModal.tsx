'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Button from '@/components/ui/Button'

interface Category {
  id: string
  name: string
  nameRw?: string | null
  description?: string | null
  descriptionRw?: string | null
}

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSave: (categoryData: any) => Promise<void>
}

export default function CategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
}: CategoryModalProps) {
  const [name, setName] = useState('')
  const [nameRw, setNameRw] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionRw, setDescriptionRw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode - pre-fill form
        setName(category.name || '')
        setNameRw(category.nameRw || '')
        setDescription(category.description || '')
        setDescriptionRw(category.descriptionRw || '')
      } else {
        // Create mode - clear form
        setName('')
        setNameRw('')
        setDescription('')
        setDescriptionRw('')
      }
      setError('')
    }
  }, [isOpen, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Category name is required')
      return
    }

    setLoading(true)

    try {
      await onSave({
        name: trimmedName,
        nameRw: nameRw.trim() || undefined,
        description: description.trim() || undefined,
        descriptionRw: descriptionRw.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={category ? 'Edit Category' : 'Add Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name (English)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main Dishes"
          required
          disabled={loading}
        />

        <Input
          label="Category Name (Kinyarwanda)"
          value={nameRw}
          onChange={(e) => setNameRw(e.target.value)}
          placeholder="e.g., Ibiryo by'ingenzi"
          disabled={loading}
        />

        <TextArea
          label="Description (English)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
          disabled={loading}
        />

        <TextArea
          label="Description (Kinyarwanda)"
          value={descriptionRw}
          onChange={(e) => setDescriptionRw(e.target.value)}
          placeholder="Ibisobanuro (optional)"
          rows={3}
          disabled={loading}
        />

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
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            fullWidth
          >
            Save Category
          </Button>
        </div>
      </form>
    </Modal>
  )
}