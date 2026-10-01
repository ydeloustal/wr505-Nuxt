<script setup lang="ts">
const features = [
  {
    title: 'Catalogue complet',
    text: 'Recherche instantanée, filtres par catégorie et par prix, tri au choix — sur les 194 produits DummyJSON.',
  },
  {
    title: 'URL partageable',
    text: 'Chaque filtre vit dans l’URL : rechargement, retour arrière et liens partagés affichent toujours la même vue.',
  },
  {
    title: 'Promotions intelligentes',
    text: 'Un moteur de calcul pur applique BEAUTY_3 et TROYES10 en centimes, sans surprise d’arrondi.',
  },
]
</script>

<template>
  <main class="landing-page">
    <section class="hero">
      <p class="eyebrow">ChampaShop</p>
      <h1>Une vitrine e-commerce rapide, moderne et accessible.</h1>
      <p class="subtitle">
        Catalogue produit, filtres avancés, recherche instantanée et moteur de promotions —
        pensés pour une expérience claire, rapide, et fidèle au SSR.
      </p>
      <NuxtLink to="/produits" class="cta">Voir le catalogue →</NuxtLink>
    </section>

    <section class="features">
      <article v-for="feature in features" :key="feature.title" class="feature-card">
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.text }}</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  min-height: calc(100vh - 74px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  padding: 3rem 1.25rem 4rem;
  background:
    radial-gradient(60rem 30rem at 15% -10%, rgba(124, 58, 237, 0.12), transparent),
    radial-gradient(50rem 26rem at 100% 10%, rgba(249, 115, 22, 0.1), transparent);
}

.hero {
  max-width: 760px;
  text-align: center;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-lg);
  padding: 4rem 2.5rem;
  box-shadow: var(--shadow-lg);
}

.eyebrow {
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-brand);
}

h1 {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.subtitle {
  max-width: 600px;
  margin: 1.25rem auto 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-muted);
}

.cta {
  display: inline-block;
  margin-top: 2rem;
  background: var(--color-text);
  color: white;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.9rem 1.8rem;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.cta:hover {
  background: var(--color-brand-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.features {
  width: 100%;
  max-width: 1000px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.feature-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.feature-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
}

.feature-card p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
  font-size: 0.92rem;
}
</style>
