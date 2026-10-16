<script setup lang="ts">
import { getPageWindow, type Pagination } from '~~/utils/catalog'

const props = defineProps<{
  pagination: Pick<Pagination<unknown>, 'page' | 'totalPages' | 'total' | 'start' | 'end'>
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const pageWindow = computed(() => getPageWindow(props.pagination.page, props.pagination.totalPages))

const goTo = (page: number) => {
  const target = Math.min(Math.max(1, Math.trunc(page) || 1), props.pagination.totalPages)
  emit('update:page', target)
}
</script>

<template>
  <nav class="pagination" aria-label="Pagination du catalogue">
    <p class="page-summary">Produits {{ pagination.start }}–{{ pagination.end }} sur {{ pagination.total }}</p>

    <div v-if="pagination.totalPages > 1" class="page-buttons">
      <button type="button" class="nav-arrow" :disabled="pagination.page <= 1" aria-label="Page précédente" @click="goTo(pagination.page - 1)">‹</button>

      <button
        v-for="page in pageWindow"
        :key="page"
        type="button"
        :class="{ active: page === pagination.page }"
        :aria-current="page === pagination.page ? 'page' : undefined"
        @click="goTo(page)"
      >
        {{ page }}
      </button>

      <label class="page-jump">
        <span>Page</span>
        <input
          :value="pagination.page"
          type="number"
          min="1"
          :max="pagination.totalPages"
          aria-label="Aller à la page"
          @change="goTo(Number(($event.target as HTMLInputElement).value))"
        >
        <span>/ {{ pagination.totalPages }}</span>
      </label>

      <button type="button" class="nav-arrow" :disabled="pagination.page >= pagination.totalPages" aria-label="Page suivante" @click="goTo(pagination.page + 1)">›</button>
    </div>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

.page-summary {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.page-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.page-buttons button {
  min-width: 44px;
  min-height: 44px;
  padding: 0 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.page-buttons button:hover:not(:disabled) {
  border-color: var(--color-border-strong);
}

.page-buttons button.active {
  border-color: var(--color-text);
  font-weight: 600;
}

.page-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-arrow {
  font-size: 1.3rem;
  line-height: 1;
}

.page-jump {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-muted);
  padding: 0 0.25rem;
}

.page-jump input {
  width: 56px;
  min-height: 44px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  text-align: center;
  font: inherit;
  color: var(--color-text);
}

.page-jump input:focus {
  outline: 2px solid var(--color-link);
  outline-offset: 1px;
  border-color: var(--color-link);
}

@media (max-width: 900px) {
  .pagination {
    justify-content: center;
  }
}
</style>
