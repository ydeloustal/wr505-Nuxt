<template>
  <div class="product-grid">
    <slot />
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

@media (min-width: 640px) and (max-width: 900px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
