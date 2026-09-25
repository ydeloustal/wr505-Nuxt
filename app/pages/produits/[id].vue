<script setup lang="ts">
import { useCartStore } from '~~/stores/cart'
import type { Product } from '~~/types/dummyjson'
import { formatDiscount, formatPrice } from '~~/utils/format'
import { buildProductSeo, getProductImages, getStockState } from '~~/utils/product'

const route = useRoute()
const { public: { apiBase } } = useRuntimeConfig()
const productId = computed(() => Number(route.params.id))

const notFound = () =>
  createError({ statusCode: 404, statusMessage: 'Produit introuvable', fatal: true })

const { data: product, pending, error, refresh } = await useAsyncData<Product>(
  () => `product-${productId.value}`,
  async () => {
    const id = productId.value
    if (!Number.isInteger(id) || id <= 0) throw notFound()

    try {
      return await $fetch<Product>(`/products/${id}`, { baseURL: apiBase })
    } catch (cause) {
      // Identifiant inexistant côté API : vraie 404 (rendue aussi côté serveur), pas une page vide.
      if ((cause as { statusCode?: number }).statusCode === 404) throw notFound()
      throw cause
    }
  },
  { watch: [() => route.params.id] },
)

// useAsyncData range l'erreur dans `error` sans faire échouer le rendu : on la relance pour
// obtenir un vrai statut HTTP 404 côté serveur et la page d'erreur de Nuxt.
if (error.value?.statusCode === 404) throw notFound()

const images = computed(() => (product.value ? getProductImages(product.value) : []))
const stockState = computed(() => getStockState(product.value?.stock ?? 0))
const outOfStock = computed(() => stockState.value.status === 'out')

const seo = computed(() => (product.value ? buildProductSeo(product.value) : null))

useSeoMeta({
  title: () => seo.value?.title ?? 'Produit | ChampaShop',
  description: () => seo.value?.description,
  ogTitle: () => seo.value?.title,
  ogDescription: () => seo.value?.description,
  ogImage: () => seo.value?.image,
  ogType: 'website',
})

const cart = useCartStore()
const quantity = ref(1)
const justAdded = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined

const clampedQuantity = computed(() => {
  const max = product.value?.stock ?? 1
  const value = Number.isFinite(quantity.value) ? Math.floor(quantity.value) : 1
  return Math.min(Math.max(value, 1), Math.max(max, 1))
})

const addToCart = () => {
  if (!product.value || outOfStock.value) return

  cart.addItem(
    {
      id: product.value.id,
      title: product.value.title,
      thumbnail: product.value.thumbnail,
      category: product.value.category,
      price: product.value.price,
    },
    clampedQuantity.value,
  )

  justAdded.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    justAdded.value = false
  }, 1500)
}
</script>

<template>
  <main class="product-detail-page">
    <NuxtLink to="/produits" class="back-link">← Retour au catalogue</NuxtLink>

    <section v-if="pending && !product" class="state" role="status">Chargement du produit...</section>
    <section v-else-if="error || !product" class="state" role="alert">
      <p>Impossible de charger ce produit.</p>
      <button type="button" @click="() => refresh()">Réessayer</button>
    </section>

    <article v-else class="product-detail">
      <ProductGallery :images="images" :title="product.title" />

      <div class="content">
        <p class="category">{{ product.category }}</p>
        <h1>{{ product.title }}</h1>
        <div class="meta-row">
          <span class="rating" :aria-label="`Note ${product.rating.toFixed(1)} sur 5`">★ {{ product.rating.toFixed(1) }}</span>
          <span v-if="product.discountPercentage > 0" class="discount">{{ formatDiscount(product.discountPercentage) }}</span>
        </div>
        <p class="price">{{ formatPrice(product.price) }}</p>

        <p class="description">{{ product.description }}</p>

        <ul class="facts">
          <li v-if="product.brand"><strong>Marque :</strong> {{ product.brand }}</li>
          <li><strong>Catégorie :</strong> {{ product.category }}</li>
          <li>
            <strong>Stock :</strong>
            <span class="stock" :class="`stock-${stockState.status}`">{{ stockState.label }}</span>
          </li>
        </ul>

        <dl class="infos">
          <div>
            <dt>Garantie</dt>
            <dd>{{ product.warrantyInformation }}</dd>
          </div>
          <div>
            <dt>Livraison</dt>
            <dd>{{ product.shippingInformation }}</dd>
          </div>
          <div>
            <dt>Retours</dt>
            <dd>{{ product.returnPolicy }}</dd>
          </div>
        </dl>

        <div v-if="product.tags?.length" class="tags">
          <span v-for="tag in product.tags" :key="tag">{{ tag }}</span>
        </div>

        <div class="cart-actions">
          <label class="qty-field">
            <span>Quantité</span>
            <input v-model.number="quantity" type="number" min="1" :max="Math.max(product.stock, 1)" step="1" :disabled="outOfStock">
          </label>
          <button type="button" class="add-button" :class="{ added: justAdded }" :disabled="outOfStock" @click="addToCart">
            {{ outOfStock ? 'Rupture de stock' : justAdded ? 'Ajouté au panier ✓' : 'Ajouter au panier' }}
          </button>
        </div>
      </div>
    </article>
  </main>
</template>

<style scoped>
.product-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 4rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 700;
}

.product-detail {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 2.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-md);
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.category {
  margin: 0;
  color: var(--color-brand);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  font-weight: 700;
}

h1 {
  margin: 0.5rem 0 1rem;
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  letter-spacing: -0.02em;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.75rem;
}

.rating {
  color: #d97706;
  font-weight: 700;
}

.discount {
  background: var(--color-danger);
  color: white;
  border-radius: 999px;
  padding: 0.35rem 0.6rem;
  font-weight: 700;
  font-size: 0.8rem;
}

.price {
  margin: 0 0 1rem;
  font-size: 2rem;
  font-weight: 800;
}

.description {
  margin: 0 0 1.25rem;
  line-height: 1.7;
  color: var(--color-muted);
}

.facts {
  list-style: none;
  padding: 0;
  margin: 0 0 1.25rem;
  display: grid;
  gap: 0.6rem;
  color: var(--color-text);
}

.stock-low {
  color: var(--color-accent);
  font-weight: 700;
}

.stock-out {
  color: var(--color-danger);
  font-weight: 700;
}

.stock-ok {
  color: var(--color-success);
  font-weight: 600;
}

.infos {
  display: grid;
  gap: 0.6rem;
  margin: 0 0 1.25rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.infos div {
  display: flex;
  gap: 0.5rem;
}

.infos dt {
  min-width: 5.5rem;
  font-weight: 700;
}

.infos dd {
  margin: 0;
  color: var(--color-muted);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tags span {
  background: #f3f2ee;
  color: var(--color-muted);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
}

.cart-actions {
  display: flex;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
}

.qty-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.qty-field input {
  width: 80px;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font: inherit;
  background: #fafaf9;
}

.add-button {
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: white;
  padding: 0.85rem 1.5rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.add-button:hover {
  transform: translateY(-1px);
}

.add-button:disabled {
  background: var(--color-muted);
  cursor: not-allowed;
  transform: none;
}

.add-button:focus-visible,
.qty-field input:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 2px;
}

.add-button.added {
  background: var(--color-success);
}

.state {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
  color: var(--color-muted);
}

.state button {
  margin-top: 1rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: white;
  padding: 0.75rem 1rem;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 760px) {
  .product-detail {
    grid-template-columns: 1fr;
  }
}
</style>
