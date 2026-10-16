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
  gap: 0.5rem;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-muted);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.compare-button:hover {
  color: var(--color-text);
}

.compare-button.selected {
  color: var(--color-text);
  font-weight: 600;
}
</style>
