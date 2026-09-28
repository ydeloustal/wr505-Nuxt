import { defineStore } from 'pinia'
import { computeCart, type CartLine } from '~~/utils/promotions'

export interface CartItem {
  productId: number
  title: string
  thumbnail?: string
  category: string
  unitPriceCents: number
  quantity: number
  stock: number
}

interface PersistedCart {
  items: CartItem[]
  promoCode?: string
}

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

const toCartLines = (items: CartItem[]): CartLine[] =>
  items.map(({ productId, category, unitPriceCents, quantity }) => ({
    productId,
    category,
    unitPriceCents,
    quantity,
  }))

export const useCartStore = defineStore('cart', () => {
  // On ne persiste que les champs nécessaires au calcul et à l'affichage de la ligne
  // (pas la description, les images ou les avis du produit) pour rester loin de la
  // limite de 4 Ko d'un cookie.
  const cartCookie = useCookie<PersistedCart>('cart', {
    default: () => ({ items: [], promoCode: undefined }),
    maxAge: CART_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const items = ref<CartItem[]>(cartCookie.value.items)
  const promoCode = ref<string | undefined>(cartCookie.value.promoCode)
  const stockMessage = ref<string | null>(null)

  const persist = () => {
    cartCookie.value = { items: items.value, promoCode: promoCode.value }
  }

  const summary = computed(() => computeCart(toCartLines(items.value), promoCode.value))
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  function addItem(
    product: {
      id: number
      title: string
      thumbnail?: string
      category: string
      price: number
      stock: number
    },
    quantity = 1,
  ) {
    const unitPriceCents = Math.round(product.price * 100)
    const existing = items.value.find((item) => item.productId === product.id)
    const currentQuantity = existing?.quantity ?? 0
    const allowed = Math.max(product.stock - currentQuantity, 0)
    const applied = Math.min(quantity, allowed)

    stockMessage.value =
      applied < quantity
        ? `Stock insuffisant pour « ${product.title} » : ${product.stock} unité(s) disponible(s).`
        : null

    if (applied <= 0) return

    if (existing) {
      existing.quantity += applied
      existing.stock = product.stock
    } else {
      items.value.push({
        productId: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        category: product.category,
        unitPriceCents,
        quantity: applied,
        stock: product.stock,
      })
    }

    persist()
  }

  function setQuantity(productId: number, quantity: number) {
    const item = items.value.find((entry) => entry.productId === productId)
    if (!item) return

    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    if (quantity > item.stock) {
      item.quantity = item.stock
      stockMessage.value = `Stock insuffisant pour « ${item.title} » : ${item.stock} unité(s) disponible(s).`
    } else {
      item.quantity = quantity
      stockMessage.value = null
    }

    persist()
  }

  function removeItem(productId: number) {
    items.value = items.value.filter((item) => item.productId !== productId)
    persist()
  }

  function setPromoCode(code: string) {
    promoCode.value = code.trim() || undefined
    persist()
  }

  function clearCart() {
    items.value = []
    promoCode.value = undefined
    stockMessage.value = null
    persist()
  }

  return {
    items,
    promoCode,
    stockMessage,
    summary,
    itemCount,
    addItem,
    setQuantity,
    removeItem,
    setPromoCode,
    clearCart,
  }
})
