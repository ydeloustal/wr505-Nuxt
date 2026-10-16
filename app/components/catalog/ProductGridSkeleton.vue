<script setup lang="ts">
import { PAGE_SIZE } from '~~/utils/catalog'
</script>

<template>
  <CatalogProductGrid aria-busy="true" aria-label="Chargement des produits">
    <article v-for="item in PAGE_SIZE" :key="item" class="skeleton-card">
      <div class="skeleton image" />
      <div class="skeleton line short" />
      <div class="skeleton line" />
      <div class="skeleton line tiny" />
    </article>
  </CatalogProductGrid>
</template>

<style scoped>
.skeleton-card {
  display: grid;
  gap: 0.6rem;
}

.skeleton {
  background: var(--color-tile);
  animation: pulse 1.4s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton.image { width: 100%; aspect-ratio: 1; }
.skeleton.line { height: 14px; }
.skeleton.line.short { width: 40%; }
.skeleton.line.tiny { width: 30%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>
