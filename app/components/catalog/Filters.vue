<script setup lang="ts">
import type { Category } from '~~/types/dummyjson'
import { ALL_CATEGORIES, SORT_OPTIONS, type CatalogFilters, type SortKey, type SortOrder } from '~~/utils/catalog'

const VISIBLE_CATEGORY_COUNT = 10

const props = defineProps<{
  filters: CatalogFilters
  categories: Category[]
  categoryCounts: Record<string, number>
  categoryTotal: number
  priceCeiling: number
  resultCount: number
}>()

const emit = defineEmits<{
  'update:category': [category: string]
  'update:sort': [sort: { sortBy: SortKey, order: SortOrder }]
  'update:price': [price: { minPrice: number | null, maxPrice: number | null }]
  reset: []
}>()

const search = defineModel<string>('search', { required: true })
const open = defineModel<boolean>('open', { default: false })

const showAllCategories = ref(false)
const minPriceInput = ref<number | ''>(props.filters.minPrice ?? '')
const maxPriceInput = ref<number | ''>(props.filters.maxPrice ?? '')

// Les champs de prix suivent l'URL (retour arrière, lien partagé, filtre retiré).
watch(() => props.filters.minPrice, (value) => {
  minPriceInput.value = value ?? ''
})
watch(() => props.filters.maxPrice, (value) => {
  maxPriceInput.value = value ?? ''
})

const currentSort = computed(() => `${props.filters.sortBy}:${props.filters.order}`)

const visibleCategories = computed(() => {
  if (showAllCategories.value) return props.categories

  const visible = props.categories.slice(0, VISIBLE_CATEGORY_COUNT)
  const active = props.categories.find(category => category.slug === props.filters.category)
  if (active && !visible.includes(active)) visible.push(active)

  return visible
})

const hiddenCategoryCount = computed(() => Math.max(0, props.categories.length - VISIBLE_CATEGORY_COUNT))

const sliderMin = computed(() => (minPriceInput.value === '' ? 0 : Math.min(minPriceInput.value, props.priceCeiling)))
const sliderMax = computed(() => (maxPriceInput.value === '' ? props.priceCeiling : Math.min(maxPriceInput.value, props.priceCeiling)))
const sliderFillStyle = computed(() => ({
  left: `${(sliderMin.value / props.priceCeiling) * 100}%`,
  right: `${100 - (sliderMax.value / props.priceCeiling) * 100}%`,
}))

const onSliderInput = (bound: 'min' | 'max', event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)

  if (bound === 'min') {
    minPriceInput.value = Math.min(value, sliderMax.value)
  }
  else {
    maxPriceInput.value = Math.max(value, sliderMin.value)
  }
}

const commitPrice = () => {
  // Une borne égale à l'extrémité du curseur revient à « pas de filtre ».
  const min = minPriceInput.value === '' || minPriceInput.value <= 0 ? null : minPriceInput.value
  const max = maxPriceInput.value === '' || maxPriceInput.value >= props.priceCeiling ? null : maxPriceInput.value
  emit('update:price', { minPrice: min, maxPrice: max })
}

const onSortChange = (value: string) => {
  const option = SORT_OPTIONS.find(candidate => candidate.value === value)
  if (option) emit('update:sort', { sortBy: option.sortBy, order: option.order })
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="filters-root">
    <div class="drawer-backdrop" :class="{ open }" @click="open = false" />

    <aside id="catalog-filters" class="filters-aside" :class="{ open }" aria-label="Filtres du catalogue">
      <div class="drawer-head">
        <h2>Filtres</h2>
        <button type="button" class="icon-button" aria-label="Fermer les filtres" @click="open = false">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="aside-body">
        <div class="search-input">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model="search" type="search" placeholder="Rechercher un produit..." aria-label="Rechercher un produit">
        </div>

        <details class="filter-section" open>
          <summary>
            Catégorie
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
          </summary>
          <ul class="option-list">
            <li>
              <button type="button" :class="{ active: filters.category === ALL_CATEGORIES }" :aria-pressed="filters.category === ALL_CATEGORIES" @click="emit('update:category', ALL_CATEGORIES)">
                <span>Toutes</span>
                <span class="count">{{ categoryTotal }}</span>
              </button>
            </li>
            <li v-for="category in visibleCategories" :key="category.slug">
              <button
                type="button"
                :class="{ active: filters.category === category.slug }"
                :aria-pressed="filters.category === category.slug"
                @click="emit('update:category', category.slug)"
              >
                <span>{{ category.name }}</span>
                <span class="count">{{ categoryCounts[category.slug] ?? 0 }}</span>
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
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
          </summary>
          <div class="price-slider">
            <div class="track" />
            <div class="track-fill" :style="sliderFillStyle" />
            <input type="range" min="0" :max="priceCeiling" step="1" :value="sliderMin" aria-label="Prix minimum" @input="onSliderInput('min', $event)" @change="commitPrice">
            <input type="range" min="0" :max="priceCeiling" step="1" :value="sliderMax" aria-label="Prix maximum" @input="onSliderInput('max', $event)" @change="commitPrice">
          </div>
          <div class="price-fields">
            <input v-model.number="minPriceInput" type="number" min="0" step="1" placeholder="0" aria-label="Prix minimum (€)" @change="commitPrice">
            <span aria-hidden="true">–</span>
            <input v-model.number="maxPriceInput" type="number" min="0" step="1" :placeholder="String(priceCeiling)" aria-label="Prix maximum (€)" @change="commitPrice">
          </div>
        </details>

        <details class="filter-section" open>
          <summary>
            Trier par
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
          </summary>
          <ul class="option-list">
            <li v-for="option in SORT_OPTIONS" :key="option.value">
              <button type="button" :class="{ active: currentSort === option.value }" :aria-pressed="currentSort === option.value" @click="onSortChange(option.value)">
                {{ option.label }}
              </button>
            </li>
          </ul>
        </details>
      </div>

      <div class="drawer-foot">
        <button type="button" class="reset-button" @click="emit('reset')">Réinitialiser</button>
        <button type="button" class="apply-button" @click="open = false">Voir {{ resultCount }} {{ resultCount > 1 ? 'produits' : 'produit' }}</button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
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

.filters-root {
  display: contents;
}

.drawer-head,
.drawer-foot,
.drawer-backdrop {
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
.price-fields input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.reset-button,
.apply-button {
  min-height: 48px;
  border-radius: var(--radius-sm);
  padding: 0 1.25rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.apply-button {
  border: none;
  background: var(--color-text);
  color: white;
}

.reset-button {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}

@media (max-width: 900px) {
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
}
</style>
