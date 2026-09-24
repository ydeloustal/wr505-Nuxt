<script setup lang="ts">
import { useCartStore } from '~~/stores/cart'

type Product = {
  id: number
  title: string
  description: string
  category: string
  price: number
  rating: number
  discountPercentage: number
  stock: number
  brand: string
  thumbnail?: string
  images?: string[]
  tags?: string[]
}

const route = useRoute()
const productId = computed(() => Number(route.params.id))

const { data: product, pending, error, refresh } = await useAsyncData<Product | null>(
  () => `product-${productId.value}`,
  async () => {
    const id = productId.value
    if (!Number.isFinite(id)) {
      return null
    }

    return await $fetch<Product>(`https://dummyjson.com/products/${id}`)
  },
  { watch: [() => route.params.id] },
)

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)

const cart = useCartStore()
const quantity = ref(1)
const justAdded = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined

const addToCart = () => {
  if (!product.value) return

  cart.addItem(
    {
      id: product.value.id,
      title: product.value.title,
      thumbnail: product.value.thumbnail,
      category: product.value.category,
      price: product.value.price,
    },
    quantity.value,
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

    <section v-if="pending" class="state">Chargement du produit...</section>
    <section v-else-if="error || !product" class="state">
      <p>Impossible de charger ce produit.</p>
      <button type="button" @click="refresh">Réessayer</button>
    </section>

    <article v-else class="product-detail">
      <div class="gallery">
        <img :src="product.thumbnail || product.images?.[0] || 'https://placehold.co/800x800/eee/999?text=Produit'" :alt="product.title" />
      </div>

      <div class="content">
        <p class="category">{{ product.category }}</p>
        <h1>{{ product.title }}</h1>
        <div class="meta-row">
          <span class="rating">★ {{ product.rating.toFixed(1) }}</span>
          <span v-if="product.discountPercentage > 0" class="discount">−{{ Math.round(product.discountPercentage) }}%</span>
        </div>
        <p class="price">{{ formatCurrency(product.price) }}</p>

        <p class="description">{{ product.description }}</p>

        <ul class="facts">
          <li><strong>Marque :</strong> {{ product.brand }}</li>
          <li><strong>Stock :</strong> {{ product.stock }} unités</li>
          <li><strong>Catégorie :</strong> {{ product.category }}</li>
        </ul>

        <div v-if="product.tags?.length" class="tags">
          <span v-for="tag in product.tags" :key="tag">{{ tag }}</span>
        </div>

        <div class="cart-actions">
          <label class="qty-field">
            <span>Quantité</span>
            <input v-model.number="quantity" type="number" min="1" step="1" />
          </label>
          <button type="button" class="add-button" :class="{ added: justAdded }" @click="addToCart">
            {{ justAdded ? 'Ajouté au panier ✓' : 'Ajouter au panier' }}
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

.gallery img {
  width: 100%;
  height: 100%;
  min-height: 420px;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: #f3f2ee;
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
