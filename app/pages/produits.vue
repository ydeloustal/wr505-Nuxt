<script setup lang="ts">
import { useCartStore } from '~~/stores/cart'
import type { ProductSummary } from '~~/types/dummyjson'
import { ALL_CATEGORIES, SORT_OPTIONS, type SortKey, type SortOrder } from '~~/utils/catalog'
import { formatPrice } from '~~/utils/format'

const { filters, update, reset } = useCatalogFilters()

// La saisie est propagée dans l'URL après 300 ms sans frappe ; `replace` évite une entrée
// d'historique par recherche.
const searchInput = useDebouncedSync(
  () => filters.value.q,
  q => update({ q }, { replace: true }),
)

const [{ data: products, status, error, refresh }, { data: categories }] = await Promise.all([
  useCatalogProducts(() => filters.value.q),
  useCatalogCategories(),
])

const { pagination, categoryCounts, categoryTotal, priceCeiling } = useCatalogView(products, filters)

const filtersOpen = ref(false)
const isLoading = computed(() => status.value === 'pending')

// Une page hors bornes dans l'URL (ex. ?page=999) est ramenée à la dernière page valide.
// On attend la fin du chargement : sans produits, le nombre de pages serait faussement de 1.
watch([status, () => pagination.value.page], ([currentStatus, page]) => {
  if (import.meta.server || currentStatus !== 'success') return
  if (page !== filters.value.page) update({ page }, { replace: true })
}, { immediate: true })

const activeChips = computed(() => {
  const { q, category, minPrice, maxPrice } = filters.value
  const chips: Array<{ key: string, label: string, clear: () => void }> = []

  if (q) {
    chips.push({ key: 'q', label: `« ${q} »`, clear: () => update({ q: '' }) })
  }

  if (category !== ALL_CATEGORIES) {
    const name = categories.value.find(item => item.slug === category)?.name ?? category
    chips.push({ key: 'category', label: name, clear: () => update({ category: ALL_CATEGORIES }) })
  }

  if (minPrice !== null || maxPrice !== null) {
    const max = maxPrice !== null ? formatPrice(maxPrice) : 'max'
    chips.push({
      key: 'price',
      label: `Prix : ${formatPrice(minPrice ?? 0)} – ${max}`,
      clear: () => update({ minPrice: null, maxPrice: null }),
    })
  }

  return chips
})

const currentSort = computed(() => `${filters.value.sortBy}:${filters.value.order}`)

const onSortChange = (sort: { sortBy: SortKey, order: SortOrder }) => update(sort)

const onMobileSortChange = (event: Event) => {
  const option = SORT_OPTIONS.find(candidate => candidate.value === (event.target as HTMLSelectElement).value)
  if (option) onSortChange(option)
}

const cart = useCartStore()
const addToCart = (product: ProductSummary) => cart.addItem(product, 1)

useSeoMeta({
  title: () => (filters.value.q ? `Recherche « ${filters.value.q} » | ChampaShop` : 'Catalogue produits | ChampaShop'),
  description: 'Parcourez le catalogue ChampaShop : recherche, filtres par catégorie et par prix, tri par prix, note ou titre.',
  ogTitle: 'Catalogue produits | ChampaShop',
  ogDescription: 'Parcourez le catalogue ChampaShop : recherche, filtres par catégorie et par prix, tri par prix, note ou titre.',
  ogType: 'website',
})
</script>

<template>
  <div class="catalog-layout">
    <CatalogFilters
      v-model:search="searchInput"
      v-model:open="filtersOpen"
      :filters="filters"
      :categories="categories"
      :category-counts="categoryCounts"
      :category-total="categoryTotal"
      :price-ceiling="priceCeiling"
      :result-count="pagination.total"
      @update:category="update({ category: $event })"
      @update:sort="onSortChange"
      @update:price="update($event)"
      @reset="reset"
    />

    <main class="catalog-page">
      <header class="catalog-header">
        <div>
          <p class="eyebrow">ChampaShop</p>
          <h1>Catalogue produits</h1>
        </div>
        <p v-if="status === 'success'" class="result-count" aria-live="polite">{{ pagination.total }} produit(s) trouvé(s)</p>
      </header>

      <div class="mobile-toolbar">
        <button type="button" class="filters-toggle" aria-controls="catalog-filters" :aria-expanded="filtersOpen" @click="filtersOpen = true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          Filtres
          <span v-if="activeChips.length" class="filters-badge">{{ activeChips.length }}</span>
        </button>
        <select :value="currentSort" aria-label="Trier par" @change="onMobileSortChange">
          <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div v-if="activeChips.length" class="active-chips">
        <span v-for="chip in activeChips" :key="chip.key" class="chip">
          {{ chip.label }}
          <button type="button" :aria-label="`Retirer le filtre ${chip.label}`" @click="chip.clear()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </span>
        <button type="button" class="link-button" @click="reset">Tout effacer</button>
      </div>

      <CatalogProductGridSkeleton v-if="isLoading" />

      <CatalogStatePanel
        v-else-if="error"
        message="Une erreur est survenue lors du chargement des produits."
        action-label="Réessayer"
        @action="refresh()"
      />

      <CatalogStatePanel
        v-else-if="!pagination.items.length"
        message="Aucun résultat ne correspond à votre recherche."
        action-label="Effacer les filtres"
        @action="reset"
      />

      <section v-else class="catalog-content">
        <CatalogProductGrid>
          <CatalogProductCard v-for="product in pagination.items" :key="product.id" :product="product" @add="addToCart" />
        </CatalogProductGrid>

        <CatalogPagination :pagination="pagination" @update:page="update({ page: $event })" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.catalog-layout {
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: start;
}

.catalog-page {
  min-width: 0;
  padding: 2.5rem 2.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-brand);
}

h1 {
  margin: 0.15rem 0 0;
  font-size: clamp(1.9rem, 4vw, 2.75rem);
  letter-spacing: -0.02em;
}

.result-count {
  margin: 0 0 0.5rem;
  color: var(--color-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.active-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 36px;
  padding: 0 0.35rem 0 0.9rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 0.875rem;
  font-weight: 600;
}

.chip button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #f3f2ee;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.chip button:hover {
  background: #e7e5e0;
}

.mobile-toolbar {
  display: none;
}

.mobile-toolbar select:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

@media (max-width: 900px) {
    .catalog-layout {
      display: block;
    }

    .catalog-page {
      padding: 1.5rem 1rem 3rem;
      gap: 1rem;
    }

    .catalog-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .result-count {
      margin: 0;
    }

    .mobile-toolbar {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.625rem;
    }

    .filters-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 44px;
      border: none;
      border-radius: 12px;
      background: var(--color-text);
      color: white;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    .filters-badge {
      min-width: 20px;
      height: 20px;
      border-radius: 999px;
      background: var(--color-brand);
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mobile-toolbar select {
      min-height: 44px;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background: var(--color-surface);
      padding: 0 0.75rem;
      font: inherit;
      font-weight: 600;
      color: var(--color-text);
    }
}
</style>
