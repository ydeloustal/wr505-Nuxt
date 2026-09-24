import { computed, type Ref } from 'vue'
import type { ProductSummary } from '~~/types/dummyjson'
import {
  ALL_CATEGORIES,
  countByCategory,
  filterProducts,
  getPriceCeiling,
  paginate,
  sortProducts,
  type CatalogFilters,
} from '~~/utils/catalog'

/** Vue dérivée du catalogue : produits filtrés, triés et paginés, plus les données des filtres. */
export function useCatalogView(products: Ref<ProductSummary[]>, filters: Ref<CatalogFilters>) {
  const sorted = computed(() =>
    sortProducts(filterProducts(products.value, filters.value), filters.value.sortBy, filters.value.order),
  )

  const pagination = computed(() => paginate(sorted.value, filters.value.page))

  // Les compteurs de catégories tiennent compte du prix mais pas de la catégorie choisie.
  const categoryCounts = computed(() =>
    countByCategory(filterProducts(products.value, { ...filters.value, category: ALL_CATEGORIES })),
  )
  const categoryTotal = computed(() =>
    Object.values(categoryCounts.value).reduce((sum, count) => sum + count, 0),
  )

  const priceCeiling = computed(() => getPriceCeiling(products.value))

  return { pagination, categoryCounts, categoryTotal, priceCeiling }
}
