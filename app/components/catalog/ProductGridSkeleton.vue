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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
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
</style>
