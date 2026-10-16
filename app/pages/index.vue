<script setup lang="ts">
import { useCartStore } from '~~/stores/cart'
import type { ProductsResponse, ProductSummary } from '~~/types/dummyjson'

const SUMMARY_FIELDS = 'id,title,price,rating,discountPercentage,category,thumbnail,stock'
const VISIBLE_CATEGORIES = 12

const { public: { apiBase } } = useRuntimeConfig()
const cart = useCartStore()

const { data: topRated } = await useAsyncData(
  'home-top-rated',
  async () => {
    const response = await $fetch<ProductsResponse<ProductSummary>>('/products', {
      baseURL: apiBase,
      query: { sortBy: 'rating', order: 'desc', limit: 4, select: SUMMARY_FIELDS },
    })
    return response.products
  },
  { default: () => [] as ProductSummary[] },
)

const { data: categories } = await useCatalogCategories()
const shownCategories = computed(() => categories.value.slice(0, VISIBLE_CATEGORIES))

const addToCart = (product: ProductSummary) => cart.addItem(product, 1)

const PROMO_CODE = 'TROYES10'
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(PROMO_CODE)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Presse-papiers indisponible : le code reste affiché et peut être recopié à la main.
  }
}

onBeforeUnmount(() => clearTimeout(copiedTimer))

useSeoMeta({
  title: 'ChampaShop | Catalogue en ligne',
  description: 'Catalogue de produits avec filtres par catégorie et par prix, comparateur et remises détaillées dans le panier.',
})
</script>

<template>
  <main class="home">
    <section class="hero">
      <div>
        <p class="label-s">Catalogue en ligne</p>
        <h1>Des produits, des prix clairs.</h1>
        <p class="lead">
          Filtrez par catégorie et par prix, comparez jusqu’à trois produits et retrouvez le détail
          de vos remises dans le panier.
        </p>
        <div class="hero-cta">
          <NuxtLink to="/produits" class="btn">Voir le catalogue</NuxtLink>
          <NuxtLink to="/produits" class="text-link">Parcourir par catégorie →</NuxtLink>
        </div>
      </div>

      <ul class="facts">
        <li><strong>Livraison offerte</strong><span>dès 80 € d’achat</span></li>
        <li><strong>Remise beauté</strong><span>−10 % dès 3 articles, appliquée automatiquement</span></li>
        <li><strong>Panier détaillé</strong><span>chaque remise est affichée ligne par ligne</span></li>
      </ul>
    </section>

    <section v-if="shownCategories.length" class="section" aria-labelledby="home-categories">
      <div class="section-head">
        <h2 id="home-categories">Catégories</h2>
        <NuxtLink to="/produits" class="text-link">Tout le catalogue</NuxtLink>
      </div>
      <ul class="rows">
        <li v-for="category in shownCategories" :key="category.slug">
          <NuxtLink :to="{ path: '/produits', query: { category: category.slug } }">{{ category.name }}</NuxtLink>
        </li>
      </ul>
    </section>

    <section class="section" aria-labelledby="home-offers">
      <div class="section-head"><h2 id="home-offers">Promotions</h2></div>
      <div class="offers">
        <article class="offer">
          <div>
            <h3>−10 % sur la beauté dès 3 articles</h3>
            <p>Appliqué automatiquement dans le panier, ligne par ligne.</p>
          </div>
          <NuxtLink :to="{ path: '/produits', query: { category: 'beauty' } }" class="text-link">Voir la beauté →</NuxtLink>
        </article>
        <article class="offer">
          <div>
            <h3>−10 € dès 50 € d’achat</h3>
            <p>Avec le code {{ PROMO_CODE }}, sur le sous-total après remise beauté.</p>
          </div>
          <span class="code">
            {{ PROMO_CODE }}
            <button type="button" :aria-label="`Copier le code ${PROMO_CODE}`" @click="copyCode">{{ copied ? 'Copié' : 'Copier' }}</button>
          </span>
        </article>
      </div>
    </section>

    <section v-if="topRated.length" class="section" aria-labelledby="home-top">
      <div class="section-head">
        <h2 id="home-top">Les mieux notés</h2>
        <NuxtLink :to="{ path: '/produits', query: { sortBy: 'rating', order: 'desc' } }" class="text-link">Tout voir</NuxtLink>
      </div>
      <CatalogProductGrid>
        <CatalogProductCard v-for="product in topRated" :key="product.id" :product="product" @add="addToCart" />
      </CatalogProductGrid>
    </section>

    <RecentlyViewed />
  </main>
</template>

<style scoped>
.home {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 4rem;
  align-items: center;
  padding-block: 4.5rem 3.5rem;
}

.hero h1 {
  margin: 0.9rem 0 1.1rem;
  font-size: clamp(2.2rem, 4.2vw, 3.4rem);
  letter-spacing: -0.03em;
  line-height: 1.08;
}

.lead {
  margin: 0;
  max-width: 30rem;
  font-size: 1.08rem;
  color: var(--color-muted);
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.5rem;
  margin-top: 2rem;
}

.btn {
  min-height: 52px;
  padding: 0 1.75rem;
  font-size: 1rem;
}

.text-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.text-link:hover {
  text-decoration-thickness: 2px;
}

.facts {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-text);
}

.facts li {
  display: grid;
  gap: 0.15rem;
  padding: 1.1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.facts strong {
  font-weight: 600;
}

.facts span {
  color: var(--color-muted);
  font-size: 0.92rem;
}

.section {
  margin-top: 3.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-text);
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-head h2 {
  margin: 0;
  font-size: 1.25rem;
}

.rows {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 3rem;
}

.rows a {
  display: flex;
  align-items: center;
  min-height: 52px;
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
  text-decoration: none;
  text-transform: capitalize;
  transition: padding 0.2s ease, border-color 0.2s ease;
}

.rows a:hover {
  padding-left: 0.35rem;
  border-bottom-color: var(--color-text);
}

.offers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.offer {
  display: grid;
  align-content: space-between;
  gap: 1rem;
  min-height: 170px;
  padding: 1.5rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.offer h3 {
  margin: 0;
  font-size: 1.15rem;
}

.offer p {
  margin: 0.35rem 0 0;
  font-size: 0.92rem;
  color: var(--color-muted);
}

.code {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0 0.5rem 0 0.9rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-2);
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 500;
}

.code button {
  min-height: 36px;
  padding: 0 0.7rem;
  border: 0;
  background: none;
  font: inherit;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding-block: 2.5rem 1.5rem;
  }

  .rows {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .home {
    padding-inline: 1rem;
  }

  .hero {
    padding-block: 2rem 1rem;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .rows {
    grid-template-columns: 1fr;
  }

  .offers {
    grid-template-columns: 1fr;
  }

  .section {
    margin-top: 2.5rem;
  }
}
</style>
