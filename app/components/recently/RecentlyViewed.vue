<script setup lang="ts">
import type { ProductSummary } from '~~/types/dummyjson'
import { formatPrice } from '~~/utils/format'

const props = defineProps<{
  /** Produit à ne pas afficher (la fiche en cours de consultation). */
  excludeId?: number
}>()

const SUMMARY_FIELDS = 'id,title,price,rating,discountPercentage,category,thumbnail,stock'
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600/eee/999?text=Produit'

const { public: { apiBase } } = useRuntimeConfig()
const { ids, clear } = useRecentlyViewed()

const visibleIds = computed(() => ids.value.filter(id => id !== props.excludeId))

// Le cookie ne garde que les identifiants : les données (prix, stock) sont relues à l'API pour ne
// jamais afficher une information périmée. Un produit devenu introuvable est simplement ignoré.
const { data: products } = useAsyncData(
  () => `recently-viewed:${visibleIds.value.join(',')}`,
  async () => {
    const results = await Promise.all(
      visibleIds.value.map(id =>
        $fetch<ProductSummary>(`/products/${id}`, { baseURL: apiBase, query: { select: SUMMARY_FIELDS } })
          .catch(() => null),
      ),
    )
    return results.filter((product): product is ProductSummary => product !== null)
  },
  { default: () => [] as ProductSummary[] },
)
</script>

<template>
  <section v-if="visibleIds.length && products.length" class="recently-viewed" aria-labelledby="recently-viewed-title">
    <div class="head">
      <h2 id="recently-viewed-title">Vus récemment</h2>
      <button type="button" class="clear" @click="clear">Effacer l’historique</button>
    </div>

    <ul class="list">
      <li v-for="product in products" :key="product.id">
        <NuxtLink :to="{ name: 'produits-id', params: { id: product.id } }" class="item">
          <img :src="product.thumbnail || PLACEHOLDER_IMAGE" :alt="product.title" loading="lazy" width="120" height="120">
          <span class="title">{{ product.title }}</span>
          <span class="price">{{ formatPrice(product.price) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recently-viewed {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.head h2 {
  margin: 0;
  font-size: 1.15rem;
}

.clear {
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--color-muted);
  font: inherit;
  font-size: 0.85rem;
  text-decoration: underline;
  cursor: pointer;
}

.clear:hover {
  color: var(--color-danger);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
  padding: 0.6rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: inherit;
  text-decoration: none;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.item:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.item img {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f2ee;
}

.title {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
}

.price {
  font-size: 0.85rem;
  font-weight: 800;
}
</style>
