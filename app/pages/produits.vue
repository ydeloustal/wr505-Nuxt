<script setup lang="ts">
import { useCartStore } from '~~/stores/cart'

type Product = {
  id: number
  title: string
  price: number
  rating: number
  discountPercentage: number
  category: string
  thumbnail?: string
  images?: string[]
  description?: string
}

const route = useRoute()
const router = useRouter()
const productPageSize = 12
const visibleCategoryCount = 10
const searchInput = ref('')
const minPriceInput = ref<number | ''>('')
const maxPriceInput = ref<number | ''>('')
const pageInput = ref('1')
const filtersOpen = ref(false)
const showAllCategories = ref(false)

const sortOptions = [
  { value: 'title:asc', label: 'Titre A → Z' },
  { value: 'title:desc', label: 'Titre Z → A' },
  { value: 'price:asc', label: 'Prix croissant' },
  { value: 'price:desc', label: 'Prix décroissant' },
  { value: 'rating:asc', label: 'Note croissante' },
  { value: 'rating:desc', label: 'Note décroissante' },
]

const normalizeNumber = (value: unknown, fallback: number | null = null) => {
  if (value === '' || value == null) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const currentFilters = computed(() => ({
  page: Math.max(1, normalizeNumber(route.query.page, 1) ?? 1),
  q: String(route.query.q ?? ''),
  category: String(route.query.category ?? 'all'),
  sortBy: String(route.query.sortBy ?? 'title'),
  order: String(route.query.order ?? 'asc'),
  minPrice: normalizeNumber(route.query.minPrice, null),
  maxPrice: normalizeNumber(route.query.maxPrice, null),
}))

const updateRoute = (patch: Record<string, string | number | undefined>) => {
  const nextQuery = { ...route.query, ...patch }

  if (nextQuery.q === '' || nextQuery.q == null) delete nextQuery.q
  if (nextQuery.category === 'all' || nextQuery.category == null) delete nextQuery.category
  if (nextQuery.minPrice === '' || nextQuery.minPrice == null) delete nextQuery.minPrice
  if (nextQuery.maxPrice === '' || nextQuery.maxPrice == null) delete nextQuery.maxPrice
  if (nextQuery.sortBy === 'title' || nextQuery.sortBy == null) delete nextQuery.sortBy
  if (nextQuery.order === 'asc' || nextQuery.order == null) delete nextQuery.order

  const page = Number(nextQuery.page ?? 1)
  nextQuery.page = Number.isFinite(page) && page > 0 ? page : 1

  router.replace({ query: nextQuery })
}

const fetchProducts = async (): Promise<Product[]> => {
  const endpoint = currentFilters.value.q ? 'https://dummyjson.com/products/search' : 'https://dummyjson.com/products'
  const payload = await $fetch<{ products?: Product[] }>(endpoint, {
    // limit: 0 demande l'intégralité du catalogue à DummyJSON (194 produits) : le tri, le
    // filtre prix et la pagination doivent porter sur tout le catalogue, pas un sous-ensemble.
    query: currentFilters.value.q ? { q: currentFilters.value.q, limit: 0 } : { limit: 0 },
  })

  const items = Array.isArray(payload.products) ? payload.products : Array.isArray(payload) ? payload : []
  return items as Product[]
}

// La clé embarque q/category : Nuxt annule automatiquement une requête devenue obsolète
// (dedupe: 'cancel') quand l'utilisateur tape vite, une réponse ancienne n'écrase donc
// jamais une réponse plus récente.
const { data: products, pending, error, refresh } = await useAsyncData(
  () => `catalog-products-${currentFilters.value.q}-${currentFilters.value.category}`,
  fetchProducts,
  { watch: [() => currentFilters.value.q, () => currentFilters.value.category] },
)

const { data: categoriesData } = await useFetch<Array<{ slug?: string; name?: string; url?: string } | string>>('https://dummyjson.com/products/categories')

const categoryOptions = computed(() => {
  const items = categoriesData.value ?? []

  return items.map((item) => {
    if (typeof item === 'string') {
      const slug = item.trim()
      return { slug, name: slug.charAt(0).toUpperCase() + slug.slice(1) }
    }

    const slug = String(item.slug ?? item.name ?? 'all').trim()
    const name = String(item.name ?? item.slug ?? slug)

    return {
      slug,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }
  })
})

const sortProducts = (items: Product[]) => {
  const sorted = [...items]
  const { sortBy, order } = currentFilters.value

  sorted.sort((a, b) => {
    const left = (a as Record<string, string | number>)[sortBy] ?? 0
    const right = (b as Record<string, string | number>)[sortBy] ?? 0

    if (typeof left === 'string' && typeof right === 'string') {
      const comparison = left.localeCompare(right)
      return order === 'desc' ? -comparison : comparison
    }

    const comparison = Number(left) - Number(right)
    return order === 'desc' ? -comparison : comparison
  })

  return sorted
}

// Texte + prix, sans la catégorie : sert à la fois à la liste affichée et aux compteurs
// de l'aside (chaque catégorie affiche combien de produits elle donnerait avec les autres filtres).
const matchesTextAndPrice = (product: Product) => {
  const query = currentFilters.value.q.trim().toLowerCase()
  const { minPrice, maxPrice } = currentFilters.value

  const matchesText =
    !query ||
    [product.title, product.category, product.description ?? '']
      .join(' ')
      .toLowerCase()
      .includes(query)

  const matchesMin = minPrice == null || product.price >= minPrice
  const matchesMax = maxPrice == null || product.price <= maxPrice

  return matchesText && matchesMin && matchesMax
}

const filteredProducts = computed(() => {
  const base = products.value ?? []
  const category = currentFilters.value.category

  return sortProducts(base.filter((product) => matchesTextAndPrice(product) && (category === 'all' || product.category === category)))
})

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  let total = 0

  for (const product of products.value ?? []) {
    if (!matchesTextAndPrice(product)) continue
    counts[product.category] = (counts[product.category] ?? 0) + 1
    total++
  }

  return { counts, total }
})

const visibleCategories = computed(() => {
  const all = categoryOptions.value
  if (showAllCategories.value) return all

  const visible = all.slice(0, visibleCategoryCount)
  const active = all.find((category) => category.slug === currentFilters.value.category)
  if (active && !visible.includes(active)) visible.push(active)

  return visible
})

const hiddenCategoryCount = computed(() => Math.max(0, categoryOptions.value.length - visibleCategoryCount))

const priceCeiling = computed(() => {
  const prices = (products.value ?? []).map((product) => product.price)
  return prices.length ? Math.ceil(Math.max(...prices)) : 1000
})

const sliderMin = computed(() => (minPriceInput.value === '' ? 0 : Math.min(minPriceInput.value, priceCeiling.value)))
const sliderMax = computed(() => (maxPriceInput.value === '' ? priceCeiling.value : Math.min(maxPriceInput.value, priceCeiling.value)))
const sliderFillStyle = computed(() => ({
  left: `${(sliderMin.value / priceCeiling.value) * 100}%`,
  right: `${100 - (sliderMax.value / priceCeiling.value) * 100}%`,
}))

const onSliderInput = (bound: 'min' | 'max', event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)

  if (bound === 'min') {
    minPriceInput.value = Math.min(value, sliderMax.value)
  } else {
    maxPriceInput.value = Math.max(value, sliderMin.value)
  }
}

const commitPrice = () => {
  // Une borne égale à l'extrémité du curseur revient à « pas de filtre ».
  const min = minPriceInput.value === '' || minPriceInput.value <= 0 ? '' : minPriceInput.value
  const max = maxPriceInput.value === '' || maxPriceInput.value >= priceCeiling.value ? '' : maxPriceInput.value
  updateRoute({ minPrice: min, maxPrice: max, page: 1 })
}

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / productPageSize)))
const currentPageItems = computed(() => {
  const start = (safePage.value - 1) * productPageSize
  return filteredProducts.value.slice(start, start + productPageSize)
})
const safePage = computed(() => Math.min(currentFilters.value.page, totalPages.value))
const hasResults = computed(() => currentPageItems.value.length > 0)
const pageRange = computed(() => {
  const start = (safePage.value - 1) * productPageSize + 1
  return { start, end: start + currentPageItems.value.length - 1 }
})

const paginationItems = computed(() => {
  const total = totalPages.value
  const current = safePage.value

  if (total <= 3) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  let start = Math.max(1, current - 1)
  const end = Math.min(total, start + 2)

  if (end - start < 2) {
    start = Math.max(1, end - 2)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)

const activeChips = computed(() => {
  const { q, category, minPrice, maxPrice } = currentFilters.value
  const chips: Array<{ key: string; label: string; clear: () => void }> = []

  if (q) {
    chips.push({ key: 'q', label: `« ${q} »`, clear: () => (searchInput.value = '') })
  }

  if (category !== 'all') {
    const name = categoryOptions.value.find((item) => item.slug === category)?.name ?? category
    chips.push({ key: 'category', label: name, clear: () => onCategoryChange('all') })
  }

  if (minPrice != null || maxPrice != null) {
    const label = `Prix : ${formatCurrency(minPrice ?? 0)} – ${maxPrice != null ? formatCurrency(maxPrice) : 'max'}`
    chips.push({
      key: 'price',
      label,
      clear: () => {
        minPriceInput.value = ''
        maxPriceInput.value = ''
        updateRoute({ minPrice: '', maxPrice: '', page: 1 })
      },
    })
  }

  return chips
})

watch(
  safePage,
  (value) => {
    pageInput.value = String(value)
  },
  { immediate: true },
)

watch(
  () => route.query.q,
  (value) => {
    searchInput.value = value ? String(value) : ''
  },
  { immediate: true },
)

watch(
  () => route.query.minPrice,
  (value) => {
    minPriceInput.value = value == null || value === '' ? '' : Number(value)
  },
  { immediate: true },
)

watch(
  () => route.query.maxPrice,
  (value) => {
    maxPriceInput.value = value == null || value === '' ? '' : Number(value)
  },
  { immediate: true },
)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (value.trim() !== currentFilters.value.q) updateRoute({ q: value.trim(), page: 1 })
  }, 300)
})

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') filtersOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  window.removeEventListener('keydown', onKeydown)
})

watch(
  safePage,
  (page) => {
    if (page !== currentFilters.value.page) {
      updateRoute({ page })
    }
  },
)

const resetFilters = () => {
  searchInput.value = ''
  minPriceInput.value = ''
  maxPriceInput.value = ''
  updateRoute({ q: '', category: 'all', sortBy: 'title', order: 'asc', minPrice: '', maxPrice: '', page: 1 })
}

const onCategoryChange = (value: string) => {
  updateRoute({ category: value, page: 1 })
}

const onSortChange = (value: string) => {
  const [sortBy, order] = value.split(':')
  updateRoute({ sortBy, order, page: 1 })
}

const goToPage = (page: number) => {
  const target = Math.min(Math.max(1, Number(page) || 1), totalPages.value)
  updateRoute({ page: target })
}

const cart = useCartStore()
const addedProductId = ref<number | null>(null)
let addedTimer: ReturnType<typeof setTimeout> | undefined

const addToCart = (product: Product) => {
  cart.addItem(
    { id: product.id, title: product.title, thumbnail: product.thumbnail, category: product.category, price: product.price },
    1,
  )
  addedProductId.value = product.id
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    addedProductId.value = null
  }, 1200)
}
</script>

<template>
  <div class="catalog-layout">
    <div class="drawer-backdrop" :class="{ open: filtersOpen }" @click="filtersOpen = false" />

    <aside id="catalog-filters" class="filters-aside" :class="{ open: filtersOpen }" aria-label="Filtres du catalogue">
      <div class="drawer-head">
        <h2>Filtres</h2>
        <button type="button" class="icon-button" aria-label="Fermer les filtres" @click="filtersOpen = false">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="aside-body">
        <div class="search-input">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model="searchInput" type="search" placeholder="Rechercher un produit..." aria-label="Rechercher un produit" >
        </div>

        <details class="filter-section" open>
          <summary>
            Catégorie
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6" /></svg>
          </summary>
          <ul class="option-list">
            <li>
              <button type="button" :class="{ active: currentFilters.category === 'all' }" :aria-pressed="currentFilters.category === 'all'" @click="onCategoryChange('all')">
                <span>Toutes</span>
                <span class="count">{{ categoryCounts.total }}</span>
              </button>
            </li>
            <li v-for="category in visibleCategories" :key="category.slug">
              <button
                type="button"
                :class="{ active: currentFilters.category === category.slug }"
                :aria-pressed="currentFilters.category === category.slug"
                @click="onCategoryChange(category.slug)"
              >
                <span>{{ category.name }}</span>
                <span class="count">{{ categoryCounts.counts[category.slug] ?? 0 }}</span>
              </button>
            </li>
          </ul>
          <button v-if="hiddenCategoryCount > 0" type="button" class="link-button" @click="showAllCategories = !showAllCategories">
            {{ showAllCategories ? 'Moins de catégories' : `+ ${hiddenCategoryCount} autres catégories` }}
          </button>
        </details>

        <details class="filter-section" open>
          <summary>
            Prix
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6" /></svg>
          </summary>
          <div class="price-slider">
            <div class="track" />
            <div class="track-fill" :style="sliderFillStyle" />
            <input type="range" min="0" :max="priceCeiling" step="1" :value="sliderMin" aria-label="Prix minimum" @input="onSliderInput('min', $event)" @change="commitPrice" >
            <input type="range" min="0" :max="priceCeiling" step="1" :value="sliderMax" aria-label="Prix maximum" @input="onSliderInput('max', $event)" @change="commitPrice" >
          </div>
          <div class="price-fields">
            <input v-model.number="minPriceInput" type="number" min="0" step="1" placeholder="0" aria-label="Prix minimum (€)" @change="commitPrice" >
            <span aria-hidden="true">–</span>
            <input v-model.number="maxPriceInput" type="number" min="0" step="1" :placeholder="String(priceCeiling)" aria-label="Prix maximum (€)" @change="commitPrice" >
          </div>
        </details>

        <details class="filter-section" open>
          <summary>
            Trier par
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6" /></svg>
          </summary>
          <ul class="option-list">
            <li v-for="option in sortOptions" :key="option.value">
              <button
                type="button"
                :class="{ active: `${currentFilters.sortBy}:${currentFilters.order}` === option.value }"
                :aria-pressed="`${currentFilters.sortBy}:${currentFilters.order}` === option.value"
                @click="onSortChange(option.value)"
              >
                {{ option.label }}
              </button>
            </li>
          </ul>
        </details>
      </div>

      <div class="drawer-foot">
        <button type="button" class="reset-button" @click="resetFilters">Réinitialiser</button>
        <button type="button" class="apply-button" @click="filtersOpen = false">Voir {{ filteredProducts.length }} {{ filteredProducts.length > 1 ? 'produits' : 'produit' }}</button>
      </div>
    </aside>

    <main class="catalog-page">
      <header class="catalog-header">
        <div>
          <p class="eyebrow">ChampaShop</p>
          <h1>Catalogue produits</h1>
        </div>
        <p v-if="!pending && !error" class="result-count">{{ filteredProducts.length }} produit(s) trouvé(s)</p>
      </header>

      <div class="mobile-toolbar">
        <button type="button" class="filters-toggle" aria-controls="catalog-filters" :aria-expanded="filtersOpen" @click="filtersOpen = true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          Filtres
          <span v-if="activeChips.length" class="filters-badge">{{ activeChips.length }}</span>
        </button>
        <select :value="`${currentFilters.sortBy}:${currentFilters.order}`" aria-label="Trier par" @change="onSortChange(($event.target as HTMLSelectElement).value)">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div v-if="activeChips.length" class="active-chips">
        <span v-for="chip in activeChips" :key="chip.key" class="chip">
          {{ chip.label }}
          <button type="button" :aria-label="`Retirer le filtre ${chip.label}`" @click="chip.clear()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </span>
        <button type="button" class="link-button" @click="resetFilters">Tout effacer</button>
      </div>

      <section v-if="pending" class="product-grid">
        <article v-for="item in 12" :key="item" class="product-card skeleton-card">
          <div class="skeleton image" />
          <div class="skeleton line short" />
          <div class="skeleton line" />
          <div class="skeleton line tiny" />
        </article>
      </section>

      <section v-else-if="error" class="state-panel">
        <p>Une erreur est survenue lors du chargement des produits.</p>
        <button type="button" @click="refresh()">Réessayer</button>
      </section>

      <section v-else-if="!hasResults" class="state-panel">
        <p>Aucun résultat ne correspond à votre recherche.</p>
        <button type="button" @click="resetFilters">Effacer les filtres</button>
      </section>

      <section v-else class="catalog-content">
        <div class="product-grid">
          <article v-for="product in currentPageItems" :key="product.id" class="product-card">
            <NuxtLink :to="{ name: 'produits-id', params: { id: product.id } }" class="product-link">
              <div class="product-image-wrap">
                <img :src="product.thumbnail || product.images?.[0] || 'https://placehold.co/600x600/eee/999?text=Produit'" :alt="product.title" loading="lazy" >
                <span v-if="product.discountPercentage > 0" class="discount-badge">−{{ Math.round(product.discountPercentage) }}%</span>
              </div>

              <div class="product-info">
                <p class="product-category">{{ product.category }}</p>
                <h2>{{ product.title }}</h2>
                <span class="rating">★ {{ product.rating.toFixed(1) }}</span>
              </div>
            </NuxtLink>

            <div class="card-foot">
              <span class="price">{{ formatCurrency(product.price) }}</span>
              <button
                type="button"
                class="add-to-cart"
                :class="{ added: addedProductId === product.id }"
                :aria-label="addedProductId === product.id ? `${product.title} ajouté au panier` : `Ajouter ${product.title} au panier`"
                @click="addToCart(product)"
              >
                <svg v-if="addedProductId === product.id" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
          </article>
        </div>

        <nav class="pagination" aria-label="Pagination du catalogue">
          <p class="page-summary">Produits {{ pageRange.start }}–{{ pageRange.end }} sur {{ filteredProducts.length }}</p>

          <div v-if="totalPages > 1" class="page-buttons">
            <button type="button" class="nav-arrow" :disabled="safePage <= 1" aria-label="Page précédente" @click="goToPage(safePage - 1)">‹</button>

            <button
              v-for="page in paginationItems"
              :key="page"
              type="button"
              :class="{ active: page === safePage }"
              :aria-current="page === safePage ? 'page' : undefined"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>

            <label class="page-jump">
              <span>Page</span>
              <input :value="pageInput" type="number" min="1" :max="totalPages" aria-label="Aller à la page" @change="goToPage(Number(($event.target as HTMLInputElement).value))" >
              <span>/ {{ totalPages }}</span>
            </label>

            <button type="button" class="nav-arrow" :disabled="safePage >= totalPages" aria-label="Page suivante" @click="goToPage(safePage + 1)">›</button>
          </div>
        </nav>
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

/* ---------- Aside ---------- */

.filters-aside {
  position: sticky;
  top: 75px;
  max-height: calc(100vh - 75px);
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  padding: 2.5rem 2rem 2.5rem 2.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.drawer-head,
.drawer-foot,
.drawer-backdrop,
.mobile-toolbar {
  display: none;
}

.aside-body {
  display: flex;
  flex-direction: column;
}

.search-input {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.search-input svg {
  position: absolute;
  left: 0.9rem;
  color: var(--color-muted);
  pointer-events: none;
}

.search-input input {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  padding: 0 1rem 0 2.6rem;
  font: inherit;
  font-size: 0.95rem;
  color: var(--color-text);
}

.filter-section {
  border-top: 1px solid var(--color-border);
  padding-bottom: 0.75rem;
}

.filter-section summary {
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.filter-section summary::-webkit-details-marker {
  display: none;
}

.filter-section summary svg {
  transition: transform 0.15s ease;
}

.filter-section:not([open]) summary svg {
  transform: rotate(180deg);
}

.option-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.option-list button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 36px;
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.option-list button:hover {
  color: var(--color-brand);
}

.option-list button.active {
  color: var(--color-brand-dark);
  font-weight: 700;
}

.count {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-muted);
}

.link-button {
  border: none;
  background: transparent;
  padding: 0.6rem 0;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-brand);
  cursor: pointer;
}

.link-button:hover {
  color: var(--color-brand-dark);
}

.price-slider {
  position: relative;
  height: 24px;
  margin: 0.25rem 0 0.9rem;
}

.price-slider .track,
.price-slider .track-fill {
  position: absolute;
  top: 10px;
  height: 4px;
  border-radius: 4px;
}

.price-slider .track {
  left: 0;
  right: 0;
  background: var(--color-border);
}

.price-slider .track-fill {
  background: var(--color-brand);
}

/* Deux curseurs natifs superposés : seules les poignées captent les clics. */
.price-slider input[type='range'] {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

.price-slider input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  pointer-events: auto;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 2px solid var(--color-brand);
  box-shadow: 0 2px 6px rgba(20, 20, 26, 0.15);
  cursor: grab;
}

.price-slider input[type='range']::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 2px solid var(--color-brand);
  box-shadow: 0 2px 6px rgba(20, 20, 26, 0.15);
  cursor: grab;
}

.price-slider input[type='range']:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.25);
}

.price-fields {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-muted);
}

.price-fields input {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  padding: 0 0.75rem;
  font: inherit;
  font-size: 0.95rem;
  color: var(--color-text);
}

.search-input input:focus,
.price-fields input:focus,
.mobile-toolbar select:focus,
.page-jump input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

/* ---------- Contenu ---------- */

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

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

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

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

.page-summary {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.page-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.page-buttons button {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.page-buttons button.active {
  background: var(--color-text);
  border-color: var(--color-text);
  color: white;
}

.page-buttons button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nav-arrow {
  font-size: 1.3rem;
  line-height: 1;
}

.page-jump {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-muted);
  padding: 0 0.25rem;
}

.page-jump input {
  width: 52px;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  text-align: center;
  font: inherit;
  color: var(--color-text);
}

.state-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-muted);
}

.state-panel button,
.reset-button,
.apply-button {
  min-height: 48px;
  border-radius: var(--radius-sm);
  padding: 0 1.25rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.state-panel button,
.apply-button {
  border: none;
  background: var(--color-text);
  color: white;
}

.state-panel button {
  margin-top: 1rem;
}

.reset-button {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}

.skeleton-card {
  padding: 0.875rem;
}

.skeleton {
  background: linear-gradient(90deg, #f3f2ee 25%, #e7e5e0 50%, #f3f2ee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
  border-radius: 12px;
}

.skeleton.image { width: 100%; aspect-ratio: 1; }
.skeleton.line { height: 14px; margin-top: 0.8rem; }
.skeleton.line.short { width: 60%; }
.skeleton.line.tiny { width: 35%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---------- Responsive ---------- */

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Sous 900px l'aside devient un tiroir ouvert par le bouton « Filtres ». */
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

  .drawer-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(20, 20, 26, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .drawer-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .filters-aside {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    width: min(340px, 88vw);
    max-height: none;
    padding: 0;
    border-right: none;
    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
    background: var(--color-surface);
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    visibility: hidden;
    transition: transform 0.25s ease, visibility 0.25s;
    overflow: hidden;
  }

  .filters-aside.open {
    transform: none;
    visibility: visible;
  }

  .drawer-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1rem 0.75rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .drawer-head h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .icon-button {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 999px;
    background: #f3f2ee;
    color: var(--color-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .aside-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1.5rem;
  }

  .option-list button {
    min-height: 44px;
  }

  .drawer-foot {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 0.625rem;
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .apply-button {
    background: var(--color-brand);
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .pagination {
    justify-content: center;
  }
}

@media (min-width: 640px) and (max-width: 900px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
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
