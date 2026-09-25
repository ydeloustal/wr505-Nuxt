<script setup lang="ts">
const props = defineProps<{
  images: string[]
  title: string
}>()

const selectedIndex = ref(0)

const current = computed(() => props.images[selectedIndex.value] ?? props.images[0])

watch(
  () => props.images,
  () => {
    selectedIndex.value = 0
  },
)
</script>

<template>
  <div class="gallery">
    <img
      v-if="current"
      class="main-image"
      :src="current"
      :alt="`${title} — image ${selectedIndex + 1} sur ${images.length}`"
      width="800"
      height="800"
    >
    <div v-else class="main-image placeholder">Aucune image</div>

    <ul v-if="images.length > 1" class="thumbs" aria-label="Images du produit">
      <li v-for="(image, index) in images" :key="image">
        <button
          type="button"
          class="thumb"
          :class="{ active: index === selectedIndex }"
          :aria-label="`Afficher l'image ${index + 1}`"
          :aria-pressed="index === selectedIndex"
          @click="selectedIndex = index"
        >
          <img :src="image" alt="" width="72" height="72" loading="lazy">
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.main-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: var(--radius-md);
  background: #f3f2ee;
}

.placeholder {
  display: grid;
  place-items: center;
  color: var(--color-muted);
}

.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.thumb {
  width: 72px;
  height: 72px;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #f3f2ee;
  cursor: pointer;
  overflow: hidden;
}

.thumb:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 2px;
}

.thumb.active {
  border-color: var(--color-brand);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
