import { defineStore } from 'pinia'
import { useAuthStore } from '~~/stores/auth'
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

// Un panier "invité" (navigation sans connexion) et un panier par utilisateur connecté (clé :
// son id DummyJSON) : se déconnecter affiche à nouveau le panier invité, jamais celui du compte
// précédent, et se reconnecter avec le même compte retrouve son panier.
interface CartCookiePayload {
  guest: PersistedCart
  byUser: Record<string, PersistedCart>
}

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

const emptyBucket = (): PersistedCart => ({ items: [], promoCode: undefined })

// Un panier lu depuis le cookie n'est jamais garanti d'avoir la forme attendue : un bucket présent
// mais sans tableau `items` valide (cookie tronqué, écrit par une version antérieure du code, édité
// à la main...) doit devenir un panier vide plutôt que laisser passer un `items` manquant, qui ferait
// planter tout appel à `.reduce`/`.find` en aval.
const normalizeBucket = (value: Partial<PersistedCart> | null | undefined): PersistedCart => ({
  items: Array.isArray(value?.items) ? value.items : [],
  promoCode: value?.promoCode,
})

// Tolère un cookie au format précédent (plat, sans partition par utilisateur) : il devient le
// panier invité au lieu de faire planter la lecture.
const normalizeCookie = (value: Partial<CartCookiePayload & PersistedCart> | null | undefined): CartCookiePayload => {
  if (value && Array.isArray(value.items)) {
    return { guest: normalizeBucket(value), byUser: {} }
  }
  return { guest: normalizeBucket(value?.guest), byUser: value?.byUser ?? {} }
}

const toCartLines = (items: CartItem[]): CartLine[] =>
  items.map(({ productId, category, unitPriceCents, quantity }) => ({
    productId,
    category,
    unitPriceCents,
    quantity,
  }))

export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore()

  // On ne persiste que les champs nécessaires au calcul et à l'affichage de la ligne
  // (pas la description, les images ou les avis du produit) pour rester loin de la
  // limite de 4 Ko d'un cookie.
  const cartCookie = useCookie<CartCookiePayload>('cart', {
    default: () => ({ guest: emptyBucket(), byUser: {} }),
    maxAge: CART_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  // Clé du panier actif : celui du compte connecté, ou le panier invité sinon.
  const bucketKey = computed(() => (auth.user ? String(auth.user.id) : null))

  const readActiveBucket = (): PersistedCart => {
    const cookie = normalizeCookie(cartCookie.value)
    return bucketKey.value ? normalizeBucket(cookie.byUser[bucketKey.value]) : cookie.guest
  }

  const items = ref<CartItem[]>(readActiveBucket().items)
  const promoCode = ref<string | undefined>(readActiveBucket().promoCode)
  const stockMessage = ref<string | null>(null)

  const persist = () => {
    const cookie = normalizeCookie(cartCookie.value)
    const bucket = { items: items.value, promoCode: promoCode.value }

    cartCookie.value = bucketKey.value
      ? { ...cookie, byUser: { ...cookie.byUser, [bucketKey.value]: bucket } }
      : { ...cookie, guest: bucket }
  }

  // Connexion / déconnexion : on recharge le panier du compte désormais actif au lieu de garder
  // affiché celui du compte précédent (ou du panier invité).
  watch(bucketKey, () => {
    const bucket = readActiveBucket()
    items.value = bucket.items
    promoCode.value = bucket.promoCode
    stockMessage.value = null
  })

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
