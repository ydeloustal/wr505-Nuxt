<script setup lang="ts">
defineProps<{
  productId: number
  title: string
}>()

const { isSelected, toggle } = useCompare()
</script>

<template>
  <button
    type="button"
    class="compare-button"
    :class="{ selected: isSelected(productId) }"
    :aria-pressed="isSelected(productId)"
    :aria-label="`Comparer ${title}`"
    @click="toggle(productId)"
  >
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
      <path v-if="isSelected(productId)" d="M20 6 9 17l-5-5" />
      <path v-else d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />
    </svg>
    <span>{{ isSelected(productId) ? 'Dans le comparateur' : 'Comparer' }}</span>
  </button>
</template>

<style scoped>
.compare-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 36px;
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.compare-button:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.compare-button.selected {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: white;
}

.compare-button:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
</style>
