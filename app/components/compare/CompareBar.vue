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
  left: 50%;
  bottom: 1rem;
  z-index: 50;
  transform: translateX(-50%);
  width: min(560px, calc(100% - 2rem));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-text);
  color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.count {
  margin: 0;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hint {
  font-size: 0.75rem;
  opacity: 0.75;
}

.clear {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  text-decoration: underline;
  cursor: pointer;
}

.go {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: var(--color-brand);
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  text-decoration: none;
}

.clear:focus-visible,
.go:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>
