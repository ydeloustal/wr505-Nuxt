import type { Category, ProductsResponse, ProductSummary } from '~~/types/dummyjson'

const SUMMARY_FIELDS = 'id,title,price,rating,discountPercentage,category,thumbnail'

/**
 * Charge le catalogue complet correspondant à la recherche, en un seul appel.
 *
 * L'API n'expose ni filtre de prix ni tri sur plusieurs critères : le filtre catégorie, le filtre
 * prix, le tri et la pagination sont donc faits côté client sur ce jeu de données (voir README).
 * Seule la recherche `q` relance un appel ; la clé en dépend, et Nuxt annule la requête devenue
 * obsolète (`signal`) : une réponse ancienne n'écrase jamais une réponse plus récente.
 */
export function useCatalogProducts(search: () => string) {
  const { public: { apiBase } } = useRuntimeConfig()

  return useAsyncData(
    () => `catalog-products:${search().trim()}`,
    async (_nuxtApp, { signal }) => {
      const q = search().trim()
      const response = await $fetch<ProductsResponse<ProductSummary>>(
        q ? '/products/search' : '/products',
        {
          baseURL: apiBase,
          // limit=0 : tout le catalogue ; select : uniquement les champs affichés dans la liste.
          query: q ? { q, limit: 0, select: SUMMARY_FIELDS } : { limit: 0, select: SUMMARY_FIELDS },
          signal,
        },
      )
      return response.products
    },
    { default: () => [] as ProductSummary[] },
  )
}

export function useCatalogCategories() {
  const { public: { apiBase } } = useRuntimeConfig()

  return useFetch<Category[]>('/products/categories', {
    baseURL: apiBase,
    key: 'catalog-categories',
    default: () => [] as Category[],
  })
}
