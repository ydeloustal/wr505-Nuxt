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

const { record: recordView } = useRecentlyViewed()

// Un produit n'entre dans l'historique qu'une fois chargé : une fiche 404 n'est jamais mémorisée.
watch(product, (loaded) => {
  if (loaded) recordView(loaded.id)
}, { immediate: true })

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
      stock: product.value.stock,
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
    <nav class="crumbs" aria-label="Fil d’Ariane">
      <NuxtLink to="/">Accueil</NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink to="/produits">Catalogue</NuxtLink>
      <template v-if="product">
        <span aria-hidden="true">/</span>
        <span aria-current="page">{{ product.title }}</span>
      </template>
    </nav>

    <section v-if="pending && !product" class="state" role="status">Chargement du produit...</section>
    <section v-else-if="error || !product" class="state" role="alert">
      <p>Impossible de charger ce produit.</p>
      <button type="button" @click="() => refresh()">Réessayer</button>
    </section>

    <article v-else class="product-detail">
      <ProductGallery :images="images" :title="product.title" />

      <div class="content">
        <p class="label-s">{{ product.category }}<template v-if="product.brand"> · {{ product.brand }}</template></p>
        <h1>{{ product.title }}</h1>
        <p class="rating" :aria-label="`Note ${product.rating.toFixed(1)} sur 5`"><strong>{{ product.rating.toFixed(1) }}</strong> sur 5</p>

        <div class="price-row">
          <span class="price">{{ formatPrice(product.price) }}</span>
          <span v-if="product.discountPercentage > 0" class="discount">{{ formatDiscount(product.discountPercentage) }}</span>
        </div>

        <p class="description">{{ product.description }}</p>

        <p class="stock" :class="`stock-${stockState.status}`">{{ stockState.label }}</p>

        <div class="cart-actions">
          <label class="qty-field">
            <span>Quantité</span>
            <input v-model.number="quantity" type="number" min="1" :max="Math.max(product.stock, 1)" step="1" :disabled="outOfStock">
          </label>
          <button type="button" class="btn add-button" :class="{ added: justAdded }" :disabled="outOfStock" @click="addToCart">
            {{ outOfStock ? 'Rupture de stock' : justAdded ? 'Ajouté au panier' : 'Ajouter au panier' }}
          </button>
        </div>

        <div class="compare-actions">
          <CompareButton :product-id="product.id" :title="product.title" />
        </div>

        <p v-if="cart.stockMessage" class="stock-message" role="alert">{{ cart.stockMessage }}</p>

        <dl class="infos">
          <div v-if="product.brand">
            <dt>Marque</dt>
            <dd>{{ product.brand }}</dd>
          </div>
          <div>
            <dt>Catégorie</dt>
            <dd>{{ product.category }}</dd>
          </div>
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

        <p v-if="product.tags?.length" class="tags">{{ product.tags.join(' · ') }}</p>
      </div>
    </article>

    <RecentlyViewed v-if="product" :exclude-id="product.id" class="recent-section" />
  </main>
</template>

<style scoped>
.product-detail-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

.crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding-block: 1rem 0.75rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.crumbs a {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  text-decoration: none;
}

.crumbs a:hover {
  color: var(--color-text);
  text-decoration: underline;
}

.crumbs [aria-current] {
  color: var(--color-text);
}

.product-detail {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 4rem;
  align-items: start;
}

.product-detail > :first-child {
  position: sticky;
  top: 125px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

h1 {
  margin: 0.35rem 0 0.6rem;
  font-size: clamp(1.6rem, 3vw, 2rem);
  letter-spacing: -0.02em;
}

.rating {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.rating strong {
  color: var(--color-text);
  font-weight: 500;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.price {
  font-size: 1.9rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.discount {
  font-weight: 500;
  color: var(--color-accent);
}

.description {
  margin: 1rem 0 0;
  max-width: 34rem;
  color: var(--color-muted);
}

.stock {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.25rem 0 0;
  font-size: 0.92rem;
  font-weight: 500;
}

.stock::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.stock-ok {
  color: var(--color-success);
}

.stock-low {
  color: var(--color-warning);
}

.stock-out {
  color: var(--color-danger);
}

.cart-actions {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.qty-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.qty-field input {
  width: 84px;
  min-height: 52px;
  padding: 0 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 1rem;
  color: var(--color-text);
  background: #fff;
}

.qty-field input:hover:not(:disabled) {
  border-color: var(--color-text);
}

.add-button {
  flex: 1;
  min-height: 52px;
  font-size: 1rem;
}

.add-button.added {
  background: var(--color-success);
  border-color: var(--color-success);
}

.compare-actions {
  margin-top: 0.5rem;
}

.stock-message {
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.85rem;
  border-left: 3px solid var(--color-danger);
  background: var(--color-surface-2);
  color: var(--color-danger);
  font-size: 0.88rem;
}

.infos {
  margin: 2rem 0 0;
  border-top: 1px solid var(--color-text);
}

.infos div {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.92rem;
}

.infos dt {
  color: var(--color-muted);
}

.infos dd {
  margin: 0;
}

.tags {
  margin: 1rem 0 0;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.recent-section {
  margin-top: 4rem;
}

.state {
  padding: 3rem 1rem;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-muted);
}

.state button {
  min-height: 44px;
  margin-top: 1rem;
  border: 1px solid var(--color-text);
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: #fff;
  padding: 0 1.25rem;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

@media (max-width: 900px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .product-detail > :first-child {
    position: static;
  }
}

@media (max-width: 640px) {
  .product-detail-page {
    padding-inline: 1rem;
  }

  .infos div {
    grid-template-columns: 6.5rem minmax(0, 1fr);
  }
}
</style>
