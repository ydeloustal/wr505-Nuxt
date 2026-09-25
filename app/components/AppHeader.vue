<script setup lang="ts">
import { useCartStore } from '~~/stores/cart'

const cart = useCartStore()
</script>

<template>
  <header class="app-header">
    <div class="bar">
      <NuxtLink to="/" class="logo">
        Champa<span>Shop</span>
      </NuxtLink>

      <nav class="nav">
        <NuxtLink to="/" class="nav-link">Accueil</NuxtLink>
        <NuxtLink to="/produits" class="nav-link">Catalogue</NuxtLink>
      </nav>

      <NuxtLink to="/panier" class="cart-link" aria-label="Voir le panier">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span v-if="cart.itemCount > 0" class="badge">{{ cart.itemCount }}</span>
      </NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(246, 245, 242, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
}

.bar {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo {
  font-weight: 800;
  font-size: 1.15rem;
  text-decoration: none;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.logo span {
  color: var(--color-brand);
}

.nav {
  display: flex;
  gap: 1.25rem;
  margin-right: auto;
}

.nav-link {
  text-decoration: none;
  color: var(--color-muted);
  font-weight: 600;
  font-size: 0.92rem;
  transition: color 0.15s ease;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color: var(--color-text);
}

.cart-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.cart-link:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--color-brand);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 640px) {
  .nav { gap: 0.85rem; }
}
</style>
