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
  padding: 3rem 1rem;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-muted);
}

.state-panel button {
  min-height: 44px;
  margin-top: 1rem;
  border: 1px solid var(--color-text);
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: #fff;
  padding: 0 1.25rem;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}
</style>
