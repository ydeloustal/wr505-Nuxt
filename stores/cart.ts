import { defineStore } from 'pinia'
import { computeCart, type CartLine } from '~~/utils/promotions'

export interface CartItem {
  productId: number
  title: string
  thumbnail?: string
  category: string
  unitPriceCents: number
  quantity: number
}

const toCartLines = (items: CartItem[]): CartLine[] =>
  items.map(({ productId, category, unitPriceCents, quantity }) => ({
    productId,
    category,
    unitPriceCents,
    quantity,
  }))

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    promoCode: undefined as string | undefined,
  }),
  getters: {
    summary: (state) => computeCart(toCartLines(state.items), state.promoCode),
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
  },
  actions: {
    addItem(product: { id: number; title: string; thumbnail?: string; category: string; price: number }, quantity = 1) {
      const unitPriceCents = Math.round(product.price * 100)
      const existing = this.items.find((item) => item.productId === product.id)

      if (existing) {
        existing.quantity += quantity
      } else {
        this.items.push({
          productId: product.id,
          title: product.title,
          thumbnail: product.thumbnail,
          category: product.category,
          unitPriceCents,
          quantity,
        })
      }
    },
    setQuantity(productId: number, quantity: number) {
      const item = this.items.find((entry) => entry.productId === productId)
      if (!item) return

      if (quantity <= 0) {
        this.removeItem(productId)
        return
      }

      item.quantity = quantity
    },
    removeItem(productId: number) {
      this.items = this.items.filter((item) => item.productId !== productId)
    },
    setPromoCode(code: string) {
      this.promoCode = code.trim() || undefined
    },
    clearCart() {
      this.items = []
      this.promoCode = undefined
    },
  },
})
