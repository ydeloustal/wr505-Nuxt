<script setup lang="ts">
import { useCartStore } from '~~/stores/cart'

const cart = useCartStore()
const promoInput = ref(cart.promoCode ?? '')

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)

const applyPromo = () => {
  cart.setPromoCode(promoInput.value)
}

watch(
  () => cart.promoCode,
  (value) => {
    promoInput.value = value ?? ''
  },
)
</script>

<template>
  <main class="cart-page">
    <header class="cart-header">
      <div>
        <p class="eyebrow">ChampaShop</p>
        <h1>Votre panier</h1>
      </div>
      <NuxtLink to="/produits" class="continue-link">← Continuer mes achats</NuxtLink>
    </header>

    <section v-if="cart.items.length === 0" class="empty-state">
      <p>Votre panier est vide.</p>
      <NuxtLink to="/produits" class="browse-link">Découvrir le catalogue</NuxtLink>
    </section>

    <section v-else class="cart-layout">
      <ul class="cart-lines">
        <li v-for="item in cart.items" :key="item.productId" class="cart-line">
          <img :src="item.thumbnail || 'https://placehold.co/160x160/eee/999?text=Produit'" :alt="item.title" >

          <div class="line-info">
            <p class="line-category">{{ item.category }}</p>
            <h2>{{ item.title }}</h2>
            <p class="line-price">{{ formatCurrency(item.unitPriceCents) }} / unité</p>
          </div>

          <div class="line-controls">
            <label class="qty-field" :aria-label="`Quantité pour ${item.title}`">
              <input
                type="number"
                min="1"
                step="1"
                :value="item.quantity"
                @change="cart.setQuantity(item.productId, Number(($event.target as HTMLInputElement).value))"
              >
            </label>
            <p class="line-total">{{ formatCurrency(item.unitPriceCents * item.quantity) }}</p>
            <button type="button" class="remove-button" aria-label="Retirer l'article" @click="cart.removeItem(item.productId)">✕</button>
          </div>
        </li>
      </ul>

      <aside class="summary-panel">
        <h2>Résumé</h2>

        <label class="promo-field">
          <span>Code promo</span>
          <div class="promo-input">
            <input v-model="promoInput" type="text" placeholder="BEAUTY_3, TROYES10..." @keyup.enter="applyPromo" >
            <button type="button" @click="applyPromo">Appliquer</button>
          </div>
        </label>

        <ul v-if="cart.summary.messages.length" class="messages">
          <li v-for="message in cart.summary.messages" :key="message">{{ message }}</li>
        </ul>

        <dl class="totals">
          <div class="totals-row">
            <dt>Sous-total</dt>
            <dd>{{ formatCurrency(cart.summary.grossCents) }}</dd>
          </div>
          <div v-for="discount in cart.summary.discounts" :key="discount.id" class="totals-row discount">
            <dt>{{ discount.label }}</dt>
            <dd>−{{ formatCurrency(discount.amountCents) }}</dd>
          </div>
          <div class="totals-row">
            <dt>Livraison</dt>
            <dd>{{ formatCurrency(cart.summary.shippingCents) }}</dd>
          </div>
          <div class="totals-row total">
            <dt>Total</dt>
            <dd>{{ formatCurrency(cart.summary.totalCents) }}</dd>
          </div>
        </dl>

        <button type="button" class="clear-button" @click="cart.clearCart">Vider le panier</button>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.cart-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 4rem;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-brand);
}

h1 {
  margin: 0.15rem 0 0;
  font-size: clamp(2rem, 4vw, 2.6rem);
  letter-spacing: -0.02em;
}

.continue-link {
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
}

.empty-state,
.browse-link {
  text-align: center;
}

.empty-state {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3.5rem 2rem;
  color: var(--color-muted);
  box-shadow: var(--shadow-sm);
}

.browse-link {
  display: inline-block;
  margin-top: 1rem;
  background: var(--color-text);
  color: white;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.cart-lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.cart-line {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 1rem;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.9rem;
  box-shadow: var(--shadow-sm);
}

.cart-line img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: #f3f2ee;
}

.line-category {
  margin: 0;
  color: var(--color-brand);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.line-info h2 {
  margin: 0.15rem 0;
  font-size: 1rem;
}

.line-price {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.85rem;
}

.line-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.qty-field input {
  width: 56px;
  padding: 0.5rem;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font: inherit;
  background: #fafaf9;
}

.line-total {
  margin: 0;
  font-weight: 700;
  min-width: 80px;
  text-align: right;
}

.remove-button {
  border: none;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
}

.remove-button:hover {
  color: var(--color-danger);
}

.summary-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 90px;
}

.summary-panel h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.promo-field {
  display: block;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.promo-input {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.promo-input input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font: inherit;
  background: #fafaf9;
}

.promo-input button {
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: white;
  padding: 0.6rem 0.9rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.messages {
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: 0.82rem;
  list-style: none;
}

.messages li + li {
  margin-top: 0.3rem;
}

.totals {
  margin: 0 0 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-muted);
}

.totals-row.discount {
  color: var(--color-success);
}

.totals-row.total {
  border-top: 1px solid var(--color-border);
  padding-top: 0.6rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text);
}

.clear-button {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  padding: 0.7rem;
  font: inherit;
  cursor: pointer;
}

.clear-button:hover {
  background: #f3f2ee;
}

@media (max-width: 820px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .summary-panel {
    position: static;
  }

  .cart-line {
    grid-template-columns: 56px 1fr;
    grid-template-areas: 'img info' 'controls controls';
  }

  .cart-line img { grid-area: img; width: 56px; height: 56px; }
  .line-info { grid-area: info; }
  .line-controls { grid-area: controls; justify-content: space-between; margin-top: 0.5rem; }
}
</style>
