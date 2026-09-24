<script setup lang="ts">
import type { ProductSummary } from '~~/types/dummyjson'
import { formatDiscount, formatPrice } from '~~/utils/format'

const props = defineProps<{
  product: ProductSummary
}>()

const emit = defineEmits<{
  add: [product: ProductSummary]
}>()

const FEEDBACK_DURATION_MS = 1200
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600/eee/999?text=Produit'

const justAdded = ref(false)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

const addToCart = () => {
  emit('add', props.product)
  justAdded.value = true
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    justAdded.value = false
  }, FEEDBACK_DURATION_MS)
}

onBeforeUnmount(() => clearTimeout(feedbackTimer))
</script>

<template>
  <article class="product-card">
    <NuxtLink :to="{ name: 'produits-id', params: { id: product.id } }" class="product-link">
      <div class="product-image-wrap">
        <img :src="product.thumbnail || PLACEHOLDER_IMAGE" :alt="product.title" loading="lazy" width="600" height="600">
        <span v-if="product.discountPercentage > 0" class="discount-badge">{{ formatDiscount(product.discountPercentage) }}</span>
      </div>

      <div class="product-info">
        <p class="product-category">{{ product.category }}</p>
        <h2>{{ product.title }}</h2>
        <span class="rating" :aria-label="`Note : ${product.rating.toFixed(1)} sur 5`">★ {{ product.rating.toFixed(1) }}</span>
      </div>
    </NuxtLink>

    <div class="card-foot">
      <span class="price">{{ formatPrice(product.price) }}</span>
      <button
        type="button"
        class="add-to-cart"
        :class="{ added: justAdded }"
        :aria-label="justAdded ? `${product.title} ajouté au panier` : `Ajouter ${product.title} au panier`"
        @click="addToCart"
      >
        <svg v-if="justAdded" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.product-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-image-wrap {
  position: relative;
  aspect-ratio: 1;
  background: #f3f2ee;
  overflow: hidden;
}

.product-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.product-card:hover .product-image-wrap img {
  transform: scale(1.06);
}

.discount-badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  background: var(--color-danger);
  color: white;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
}

.product-info {
  padding: 0.875rem 0.875rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.product-category {
  margin: 0;
  color: var(--color-brand);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.product-info h2 {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.35;
}

.rating {
  color: #b45309;
  font-weight: 600;
  font-size: 0.8rem;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem 0.875rem;
}

.price {
  font-weight: 800;
  font-size: 1rem;
}

.add-to-cart {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: var(--color-text);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.add-to-cart:hover {
  transform: scale(1.06);
}

.add-to-cart.added {
  background: var(--color-success);
}

@media (max-width: 400px) {
    .card-foot {
      padding: 0.5rem 0.625rem 0.625rem;
    }

    .product-info {
      padding: 0.625rem 0.625rem 0;
    }

    .price {
      font-size: 0.9rem;
    }
}
</style>
