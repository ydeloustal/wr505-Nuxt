<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'
import { useCartStore } from '~~/stores/cart'

const cart = useCartStore()
const auth = useAuthStore()
const route = useRoute()

const search = ref('')

// Le champ reprend la recherche de l'URL quand on est déjà sur le catalogue.
watch(
  () => route.query.q,
  (q) => { search.value = typeof q === 'string' ? q : '' },
  { immediate: true },
)

const submitSearch = () => {
  const q = search.value.trim()
  return navigateTo({ path: '/produits', query: q ? { q } : {} })
}
</script>

<template>
  <header class="app-header">
    <p class="announce">Livraison offerte dès 80 € d’achat</p>

    <div class="bar">
      <NuxtLink to="/" class="logo">ChampaShop</NuxtLink>

      <form class="search" role="search" @submit.prevent="submitSearch">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <label class="sr-only" for="header-search">Rechercher un produit</label>
        <input id="header-search" v-model="search" type="search" placeholder="Rechercher un produit">
      </form>

      <nav class="nav" aria-label="Navigation principale">
        <NuxtLink to="/produits" class="nav-link">Catalogue</NuxtLink>
        <NuxtLink v-if="auth.isAuthenticated" to="/compte" class="nav-link">{{ auth.user?.firstName }}</NuxtLink>
        <NuxtLink v-else to="/connexion" class="nav-link">Connexion</NuxtLink>
        <NuxtLink to="/panier" class="nav-link" :aria-label="`Panier, ${cart.itemCount} article${cart.itemCount > 1 ? 's' : ''}`">
          Panier ({{ cart.itemCount }})
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.announce {
  margin: 0;
  padding: 0.45rem 1rem;
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-muted);
}

.bar {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
  min-height: 68px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 2rem;
}

.logo {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 600;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  text-decoration: none;
  color: var(--color-text);
}

.search {
  position: relative;
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
}

.search svg {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  pointer-events: none;
}

.search input {
  width: 100%;
  min-height: 44px;
  padding: 0 0.9rem 0 2.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  font: inherit;
  color: var(--color-text);
}

.search input::placeholder {
  color: #6d6d68;
}

.search input:hover {
  border-color: var(--color-text);
}

.search input:focus {
  outline: 2px solid var(--color-link);
  outline-offset: 1px;
  border-color: var(--color-link);
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.75rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--color-text);
  transition: background 0.2s ease;
}

.nav-link:hover {
  background: var(--color-surface-2);
}

.nav-link.router-link-active {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 8px;
}

@media (max-width: 720px) {
  .announce {
    display: none;
  }

  .bar {
    padding: 0.25rem 1rem 0.75rem;
    min-height: 0;
    grid-template-columns: 1fr auto;
    gap: 0 1rem;
  }

  .search {
    grid-column: 1 / -1;
    grid-row: 2;
    max-width: none;
  }

  .nav-link {
    padding: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .nav-link:first-child {
    display: none;
  }
}
</style>
