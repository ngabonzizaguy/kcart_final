import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart item structure
export interface CartItem {
  menuItemId: string
  name: string
  nameRw: string | null
  price: number
  quantity: number
  imageUrl: string | null
}

// Cart store state
interface CartState {
  vendorId: string | null
  vendorSlug: string | null
  vendorName: string | null
  deliveryFee: number
  acceptedPaymentMethods: string[]
  items: CartItem[]
  isDrawerOpen: boolean

  // Actions
  addItem: (
    vendorId: string,
    vendorSlug: string,
    vendorName: string,
    deliveryFee: number,
    acceptedPaymentMethods: string[],
    item: Omit<CartItem, 'quantity'>
  ) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  incrementQuantity: (menuItemId: string) => void
  decrementQuantity: (menuItemId: string) => void
  clearCart: () => void
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void

  // Computed values
  itemCount: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      vendorId: null,
      vendorSlug: null,
      vendorName: null,
      deliveryFee: 0,
      acceptedPaymentMethods: [],
      items: [],
      isDrawerOpen: false,

      addItem: (vendorId, vendorSlug, vendorName, deliveryFee, acceptedPaymentMethods, item) => {
        const state = get()

        // If cart has items from different vendor, clear cart first
        if (state.vendorId && state.vendorId !== vendorId) {
          set({
            items: [],
            vendorId,
            vendorSlug,
            vendorName,
            deliveryFee,
            acceptedPaymentMethods,
          })
        }

        const existingItem = state.items.find(
          (i) => i.menuItemId === item.menuItemId
        )

        if (existingItem) {
          // Item already in cart, increment quantity
          set({
            items: state.items.map((i) =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          // New item, add to cart
          set({
            items: [...state.items, { ...item, quantity: 1 }],
            vendorId,
            vendorSlug,
            vendorName,
            deliveryFee,
            acceptedPaymentMethods,
          })
        }

        // Open drawer when item added
        set({ isDrawerOpen: true })
      },

      removeItem: (menuItemId) => {
        const state = get()
        const newItems = state.items.filter((i) => i.menuItemId !== menuItemId)

        set({
          items: newItems,
          // Reset vendor info if cart becomes empty
          vendorId: newItems.length === 0 ? null : state.vendorId,
          vendorSlug: newItems.length === 0 ? null : state.vendorSlug,
          vendorName: newItems.length === 0 ? null : state.vendorName,
        })
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
        } else {
          set({
            items: get().items.map((i) =>
              i.menuItemId === menuItemId ? { ...i, quantity } : i
            ),
          })
        }
      },

      incrementQuantity: (menuItemId) => {
        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        })
      },

      decrementQuantity: (menuItemId) => {
        const item = get().items.find((i) => i.menuItemId === menuItemId)
        if (item && item.quantity > 1) {
          set({
            items: get().items.map((i) =>
              i.menuItemId === menuItemId
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          })
        } else {
          get().removeItem(menuItemId)
        }
      },

      clearCart: () => {
        set({
          items: [],
          vendorId: null,
          vendorSlug: null,
          vendorName: null,
          deliveryFee: 0,
          acceptedPaymentMethods: [],
          isDrawerOpen: false,
        })
      },

      openDrawer: () => set({ isDrawerOpen: true }),

      closeDrawer: () => set({ isDrawerOpen: false }),

      toggleDrawer: () => set({ isDrawerOpen: !get().isDrawerOpen }),

      // Computed values
      itemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      subtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'deligo-cart', // localStorage key
      partialize: (state) => ({
        // Don't persist isDrawerOpen - drawer should be closed on page load
        vendorId: state.vendorId,
        vendorSlug: state.vendorSlug,
        vendorName: state.vendorName,
        deliveryFee: state.deliveryFee,
        acceptedPaymentMethods: state.acceptedPaymentMethods,
        items: state.items,
      }),
    }
  )
)