<script setup lang="ts">
import { COMPARE_MAX } from '~~/utils/compare'

const { ids, message, clear } = useCompare()
</script>

<template>
  <div>
    <!-- Toujours présente dans le DOM : une région aria-live ajoutée en même temps que son texte n'est pas annoncée. -->
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ message }}</p>

    <aside v-if="ids.length" class="compare-bar" aria-label="Comparateur de produits">
      <p class="count">
        <strong>{{ ids.length }}</strong> / {{ COMPARE_MAX }} produit{{ ids.length > 1 ? 's' : '' }} à comparer
      </p>
      <div class="actions">
        <button type="button" class="clear" @click="clear">Vider</button>
        <NuxtLink
          v-if="ids.length >= 2"
          :to="{ path: '/comparer' }"
          class="go"
        >
          Comparer ({{ ids.length }})
        </NuxtLink>
        <span v-else class="hint">Ajoutez au moins un autre produit</span>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.compare-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem max(1.5rem, calc((100% - 1180px) / 2 + 1.5rem));
  background: #fff;
  border-top: 1px solid var(--color-text);
}

.count {
  margin: 0;
  font-size: 0.92rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hint {
  font-size: 0.8rem;
  color: var(--color-muted);
}

.clear {
  min-height: 44px;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-link);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.go {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1.1rem;
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: #fff;
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
}

.go:hover {
  background: var(--color-brand-dark);
}

@media (max-width: 640px) {
  .compare-bar {
    padding-inline: 1rem;
  }

  .count {
    font-size: 0.82rem;
  }
}
</style>
