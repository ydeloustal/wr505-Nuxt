<script setup lang="ts">
defineProps<{
  message: string
  actionLabel: string
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <section class="state-panel" role="status">
    <p>{{ message }}</p>
    <button type="button" @click="$emit('action')">{{ actionLabel }}</button>
  </section>
</template>

<style scoped>
.state-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-muted);
}

.state-panel button {
  min-height: 48px;
  margin-top: 1rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: white;
  padding: 0 1.25rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
</style>
