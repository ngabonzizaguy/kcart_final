'use client'

import { useState, useEffect } from 'react'
import { Utensils, Plus, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import MenuItemCard from '@/components/vendor/MenuItemCard'
import MenuItemModal from '@/components/vendor/MenuItemModal'
import CategoryModal from '@/components/vendor/CategoryModal'

interface Category {
  id: string
  name: string
  nameRw?: string | null
  description?: string | null
  descriptionRw?: string | null
  sortOrder: number
  _count: { menuItems: number }
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
  sortOrder: number
  category: {
    id: string
    name: string
    nameRw?: string | null
  }
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Menu item modal state
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)

  // Category menu state
  const [openCategoryMenu, setOpenCategoryMenu] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    fetchCategories()
    fetchMenuItems()
  }, [])

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Update filter if selected category is deleted
  useEffect(() => {
    if (selectedFilter !== 'all') {
      const categoryExists = categories.some(c => c.id === selectedFilter)
      if (!categoryExists) {
        setSelectedFilter('all')
      }
    }
  }, [categories, selectedFilter])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/vendor/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      console.error('Fetch categories error:', error)
      setToastMessage({ type: 'error', message: 'Failed to load categories' })
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/vendor/menu-items')
      if (!response.ok) {
        throw new Error('Failed to fetch menu items')
      }
      const data = await response.json()
      setMenuItems(data.menuItems)
    } catch (error) {
      console.error('Fetch menu items error:', error)
      setToastMessage({ type: 'error', message: 'Failed to load menu items' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCategory = async (categoryData: any) => {
    try {
      const url = selectedCategory
        ? `/api/vendor/categories/${selectedCategory.id}`
        : '/api/vendor/categories'
      const method = selectedCategory ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save category')
      }

      await fetchCategories()
      setToastMessage({
        type: 'success',
        message: selectedCategory ? 'Category updated!' : 'Category created!'
      })
    } catch (error: any) {
      throw error
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/vendor/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      await fetchCategories()
      setToastMessage({ type: 'success', message: 'Category deleted!' })
      setOpenCategoryMenu(null)
    } catch (error: any) {
      setToastMessage({ type: 'error', message: error.message })
    }
  }

  const handleSaveMenuItem = async (itemData: any) => {
    try {
      const url = selectedMenuItem
        ? `/api/vendor/menu-items/${selectedMenuItem.id}`
        : '/api/vendor/menu-items'
      const method = selectedMenuItem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save menu item')
      }

      await fetchMenuItems()
      await fetchCategories() // Refresh category counts
      setToastMessage({
        type: 'success',
        message: selectedMenuItem ? 'Menu item updated!' : 'Menu item created!'
      })
    } catch (error: any) {
      throw error
    }
  }

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/vendor/menu-items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete menu item')
      }

      await fetchMenuItems()
      await fetchCategories() // Refresh category counts
      setToastMessage({ type: 'success', message: 'Menu item deleted!' })
    } catch (error: any) {
      throw error
    }
  }

  const handleToggleAvailability = async (itemId: string, newAvailability: boolean) => {
    try {
      const response = await fetch(`/api/vendor/menu-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newAvailability })
      })

      if (!response.ok) {
        throw new Error('Failed to update availability')
      }

      // Optimistic update
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: newAvailability } : item
        )
      )
    } catch (error) {
      console.error('Toggle availability error:', error)
      setToastMessage({ type: 'error', message: 'Failed to update availability' })
      // Revert on error
      await fetchMenuItems()
    }
  }

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setIsCategoryModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setIsCategoryModalOpen(true)
    setOpenCategoryMenu(null)
  }

  const handleAddMenuItem = () => {
    if (categories.length === 0) {
      setToastMessage({ type: 'error', message: 'Please create a category first' })
      return
    }
    setSelectedMenuItem(null)
    setIsMenuItemModalOpen(true)
  }

  const handleEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item)
    setIsMenuItemModalOpen(true)
  }

  const getFilteredItems = () => {
    if (selectedFilter === 'all') {
      return menuItems
    }
    return menuItems.filter((item) => item.categoryId === selectedFilter)
  }

  const filteredItems = getFilteredItems()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
          <p className="text-gray-600 mt-1">
            Manage your categories and menu items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleAddCategory}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleAddMenuItem}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl p-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* All Items Chip */}
          <button
            onClick={() => setSelectedFilter('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all min-h-touch',
              selectedFilter === 'all'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white/60 text-gray-700 hover:bg-white/80'
            )}
          >
            <span className="font-medium">All Items</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                selectedFilter === 'all'
                  ? 'bg-white/30'
                  : 'bg-gray-200'
              )}
            >
              {menuItems.length}
            </span>
          </button>

          {/* Category Chips */}
          {categories.map((category) => (
            <div key={category.id} className="relative">
              <button
                onClick={() => setSelectedFilter(category.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all min-h-touch',
                  selectedFilter === category.id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                )}
              >
                <span className="font-medium">{category.name}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    selectedFilter === category.id
                      ? 'bg-white/30'
                      : 'bg-gray-200'
                  )}
                >
                  {category._count.menuItems}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenCategoryMenu(openCategoryMenu === category.id ? null : category.id)
                  }}
                  className={cn(
                    'ml-1 p-1 rounded hover:bg-white/20 transition-colors',
                    selectedFilter === category.id ? 'text-white' : 'text-gray-600'
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </button>

              {/* Category Menu Dropdown */}
              {openCategoryMenu === category.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenCategoryMenu(null)}
                  />
                  <div className="absolute top-full right-0 mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-w-[120px]">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Utensils className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {menuItems.length === 0
              ? 'Your menu is empty'
              : selectedFilter === 'all'
              ? 'No menu items yet'
              : 'No items in this category'}
          </h3>
          <p className="text-gray-600">
            {menuItems.length === 0
              ? 'Add categories and items to get started.'
              : 'Add menu items to fill your menu.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onClick={() => handleEditMenuItem(item)}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          setSelectedCategory(null)
        }}
        category={selectedCategory}
        onSave={handleSaveCategory}
      />

      {/* Menu Item Modal */}
      <MenuItemModal
        isOpen={isMenuItemModalOpen}
        onClose={() => {
          setIsMenuItemModalOpen(false)
          setSelectedMenuItem(null)
        }}
        item={selectedMenuItem}
        categories={categories}
        onSave={handleSaveMenuItem}
        onDelete={handleDeleteMenuItem}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-down">
          <div
            className={cn(
              'rounded-xl border p-4 shadow-lg backdrop-blur-md',
              toastMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-900'
                : 'bg-red-50 border-red-200 text-red-900'
            )}
          >
            <p className="text-sm font-medium">{toastMessage.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}