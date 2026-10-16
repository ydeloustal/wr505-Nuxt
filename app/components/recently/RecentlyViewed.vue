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
  margin-top: 3.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-text);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.head h2 {
  margin: 0;
  font-size: 1.25rem;
}

.clear {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1.25rem 1rem;
}

.item {
  display: grid;
  gap: 0.5rem;
  text-decoration: none;
}

.item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--color-tile);
}

.title {
  font-size: 0.86rem;
  font-weight: 500;
  line-height: 1.3;
}

.item:hover .title {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.price {
  font-size: 0.86rem;
  color: var(--color-muted);
}

@media (max-width: 900px) {
  .list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .list {
    display: flex;
    overflow-x: auto;
    margin-inline: -1rem;
    padding-inline: 1rem;
    scrollbar-width: none;
  }

  .item {
    flex: none;
    width: 124px;
  }
}
</style>
