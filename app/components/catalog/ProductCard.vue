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
        <span class="rating" :aria-label="`Note : ${product.rating.toFixed(1)} sur 5`">{{ product.rating.toFixed(1) }} sur 5</span>
      </div>
    </NuxtLink>

    <div class="card-compare">
      <CompareButton :product-id="product.id" :title="product.title" />
    </div>

    <div class="card-foot">
      <span class="price">{{ formatPrice(product.price) }}</span>
      <button
        type="button"
        class="add-to-cart"
        :class="{ added: justAdded }"
        :aria-label="justAdded ? `${product.title} ajouté au panier` : `Ajouter ${product.title} au panier`"
        @click="addToCart"
      >
        {{ justAdded ? 'Ajouté' : 'Ajouter' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.product-link {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  color: inherit;
  text-decoration: none;
}

.product-image-wrap {
  position: relative;
  aspect-ratio: 1;
  background: var(--color-tile);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.product-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.discount-badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  background: #fff;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-accent);
}

.product-info {
  display: grid;
  gap: 0.15rem;
}

.product-category {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.product-info h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
}

.product-link:hover h2 {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.rating {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.card-compare {
  margin-top: -0.25rem;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: auto;
}

.price {
  font-weight: 600;
  font-size: 1.05rem;
  line-height: 44px;
  white-space: nowrap;
}

.add-to-cart {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--color-text);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.add-to-cart:hover {
  border-color: var(--color-text);
}

.add-to-cart.added {
  border-color: var(--color-success);
  color: var(--color-success);
}

@media (max-width: 640px) {
  .card-foot {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }

  .price {
    line-height: 1.4;
  }

  .add-to-cart {
    width: 100%;
  }
}
</style>
