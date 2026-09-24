import type { ProductSummary } from '~~/types/dummyjson'

export const PAGE_SIZE = 12
export const ALL_CATEGORIES = 'all'

export const SORT_KEYS = ['title', 'price', 'rating'] as const
export type SortKey = (typeof SORT_KEYS)[number]
export type SortOrder = 'asc' | 'desc'

export interface CatalogFilters {
  page: number
  q: string
  category: string
  sortBy: SortKey
  order: SortOrder
  minPrice: number | null
  maxPrice: number | null
}

export const DEFAULT_FILTERS: CatalogFilters = {
  page: 1,
  q: '',
  category: ALL_CATEGORIES,
  sortBy: 'title',
  order: 'asc',
  minPrice: null,
  maxPrice: null,
}

export const SORT_OPTIONS: ReadonlyArray<{ value: string, label: string, sortBy: SortKey, order: SortOrder }> = [
  { value: 'title:asc', label: 'Titre A → Z', sortBy: 'title', order: 'asc' },
  { value: 'title:desc', label: 'Titre Z → A', sortBy: 'title', order: 'desc' },
  { value: 'price:asc', label: 'Prix croissant', sortBy: 'price', order: 'asc' },
  { value: 'price:desc', label: 'Prix décroissant', sortBy: 'price', order: 'desc' },
  { value: 'rating:asc', label: 'Note croissante', sortBy: 'rating', order: 'asc' },
  { value: 'rating:desc', label: 'Note décroissante', sortBy: 'rating', order: 'desc' },
]

export interface Pagination<T> {
  items: T[]
  page: number
  totalPages: number
  total: number
  /** Rang (1-indexé) du premier et du dernier élément affiché ; 0 si la page est vide. */
  start: number
  end: number
}

const firstValue = (value: unknown): unknown => (Array.isArray(value) ? value[0] : value)

const parseString = (value: unknown): string => {
  const first = firstValue(value)
  return typeof first === 'string' ? first.trim() : ''
}

const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(parseString(value))
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null
}

const parsePrice = (value: unknown): number | null => {
  const raw = parseString(value)
  if (raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/**
 * Convertit les query params de l'URL en filtres valides. Toute valeur absente ou invalide
 * retombe sur la valeur par défaut : l'URL reste la source de vérité sans jamais casser la page.
 */
export const parseCatalogQuery = (query: Record<string, unknown>): CatalogFilters => {
  const sortBy = parseString(query.sortBy)
  let minPrice = parsePrice(query.minPrice)
  let maxPrice = parsePrice(query.maxPrice)

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice]
  }

  return {
    page: parsePositiveInteger(query.page) ?? DEFAULT_FILTERS.page,
    q: parseString(query.q),
    category: parseString(query.category) || ALL_CATEGORIES,
    sortBy: (SORT_KEYS as readonly string[]).includes(sortBy) ? (sortBy as SortKey) : DEFAULT_FILTERS.sortBy,
    order: parseString(query.order) === 'desc' ? 'desc' : 'asc',
    minPrice,
    maxPrice,
  }
}

/** Inverse de `parseCatalogQuery` : n'écrit que les valeurs différentes des valeurs par défaut. */
export const toCatalogQuery = (filters: CatalogFilters): Record<string, string> => {
  const query: Record<string, string> = {}

  if (filters.page > 1) query.page = String(filters.page)
  if (filters.q.trim()) query.q = filters.q.trim()
  if (filters.category !== ALL_CATEGORIES) query.category = filters.category
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) query.sortBy = filters.sortBy
  if (filters.order !== DEFAULT_FILTERS.order) query.order = filters.order
  if (filters.minPrice !== null) query.minPrice = String(filters.minPrice)
  if (filters.maxPrice !== null) query.maxPrice = String(filters.maxPrice)

  return query
}

type ProductFilter = Pick<CatalogFilters, 'category' | 'minPrice' | 'maxPrice'>

/** Filtre par catégorie et par fourchette de prix (l'API DummyJSON ne propose pas de prix min/max). */
export const filterProducts = <T extends ProductSummary>(products: T[], filter: ProductFilter): T[] =>
  products.filter(
    product =>
      (filter.category === ALL_CATEGORIES || product.category === filter.category)
      && (filter.minPrice === null || product.price >= filter.minPrice)
      && (filter.maxPrice === null || product.price <= filter.maxPrice),
  )

export const sortProducts = <T extends ProductSummary>(products: T[], sortBy: SortKey, order: SortOrder): T[] => {
  const direction = order === 'desc' ? -1 : 1

  return [...products].sort((a, b) => {
    const comparison = sortBy === 'title' ? a.title.localeCompare(b.title, 'fr') : a[sortBy] - b[sortBy]
    return comparison * direction
  })
}

/** Découpe une liste en pages ; une page hors bornes est ramenée à la dernière page valide. */
export const paginate = <T>(items: T[], requestedPage: number, pageSize = PAGE_SIZE): Pagination<T> => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const offset = (page - 1) * pageSize
  const pageItems = items.slice(offset, offset + pageSize)

  return {
    items: pageItems,
    page,
    totalPages,
    total: items.length,
    start: pageItems.length ? offset + 1 : 0,
    end: offset + pageItems.length,
  }
}

/** Nombre de produits par catégorie, pour les compteurs du filtre. */
export const countByCategory = (products: ProductSummary[]): Record<string, number> =>
  products.reduce<Record<string, number>>((counts, product) => {
    counts[product.category] = (counts[product.category] ?? 0) + 1
    return counts
  }, {})

/** Borne haute du curseur de prix : le prix maximum du catalogue arrondi à l'entier supérieur. */
export const getPriceCeiling = (products: ProductSummary[], fallback = 1000): number =>
  products.length ? Math.ceil(Math.max(...products.map(product => product.price))) : fallback

/** Fenêtre de numéros de page centrée sur la page courante. */
export const getPageWindow = (page: number, totalPages: number, size = 3): number[] => {
  const length = Math.min(size, totalPages)
  const start = Math.min(Math.max(1, page - Math.floor(size / 2)), totalPages - length + 1)
  return Array.from({ length }, (_, index) => start + index)
}
