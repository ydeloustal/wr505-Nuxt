<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'
import { useCartStore } from '~~/stores/cart'

const cart = useCartStore()
const auth = useAuthStore()
const promoInput = ref(cart.promoCode ?? '')
const orderConfirmed = ref(false)

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

// Rajouter un article après une commande validée doit faire disparaître le message de
// confirmation : on repasse en vue panier normale.
watch(
  () => cart.itemCount,
  (count) => {
    if (count > 0) orderConfirmed.value = false
  },
)

const validateOrder = () => {
  if (!auth.isAuthenticated) {
    navigateTo({ path: '/connexion', query: { redirect: '/panier' } })
    return
  }

  cart.clearCart()
  orderConfirmed.value = true
}

useSeoMeta({
  title: 'Panier | ChampaShop',
  description: 'Votre panier ChampaShop : articles, code promo et récapitulatif de commande.',
})
</script>

<template>
  <main class="cart-page">
    <nav class="crumbs" aria-label="Fil d’Ariane">
      <NuxtLink to="/produits">← Continuer mes achats</NuxtLink>
    </nav>

    <header class="cart-header">
      <h1>Panier</h1>
      <p v-if="cart.itemCount > 0 && !orderConfirmed" class="count">{{ cart.itemCount }} article{{ cart.itemCount > 1 ? 's' : '' }}</p>
    </header>

    <ol class="steps" aria-label="Étapes de commande">
      <li :aria-current="!orderConfirmed ? 'step' : undefined">1 Panier</li>
      <li>2 Connexion</li>
      <li :aria-current="orderConfirmed ? 'step' : undefined">3 Confirmation</li>
    </ol>

    <p v-if="cart.stockMessage" class="stock-message" role="alert">{{ cart.stockMessage }}</p>

    <section v-if="orderConfirmed" class="confirmation-state" role="status">
      <h2>Commande validée !</h2>
      <p>Merci pour votre achat. Un récapitulatif vous sera envoyé par e-mail.</p>
      <NuxtLink to="/produits" class="btn browse-link">Continuer mes achats</NuxtLink>
    </section>

    <section v-else-if="cart.items.length === 0" class="empty-state">
      <p>Votre panier est vide.</p>
      <NuxtLink to="/produits" class="btn browse-link">Découvrir le catalogue</NuxtLink>
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
                :max="item.stock"
                step="1"
                :value="item.quantity"
                @change="cart.setQuantity(item.productId, Number(($event.target as HTMLInputElement).value))"
              >
            </label>
            <p class="line-total">{{ formatCurrency(item.unitPriceCents * item.quantity) }}</p>
            <button type="button" class="remove-button" :aria-label="`Retirer ${item.title} du panier`" @click="cart.removeItem(item.productId)">Retirer</button>
          </div>
        </li>
      </ul>

      <aside class="summary-panel">
        <h2>Résumé</h2>

        <label class="promo-field">
          <span>Code promo</span>
          <div class="promo-input">
            <input v-model="promoInput" type="text" placeholder="TROYES10" autocomplete="off" @keyup.enter="applyPromo" >
            <button type="button" class="btn ghost" @click="applyPromo">Appliquer</button>
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

        <p v-if="!auth.isAuthenticated" class="login-hint">Connectez-vous pour valider votre commande.</p>

        <button type="button" class="btn checkout-button" @click="validateOrder">
          {{ auth.isAuthenticated ? 'Valider la commande' : 'Se connecter pour commander' }}
        </button>
        <button type="button" class="clear-button" @click="cart.clearCart">Vider le panier</button>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.cart-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

.crumbs {
  padding-block: 1rem 0.5rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.crumbs a {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  text-decoration: none;
}

.crumbs a:hover {
  color: var(--color-text);
  text-decoration: underline;
}

.cart-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

h1 {
  margin: 0;
  font-size: 1.9rem;
  letter-spacing: -0.02em;
}

.count {
  margin: 0;
  color: var(--color-muted);
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 1rem 0 1.5rem;
  padding: 0;
  list-style: none;
  font-size: 0.9rem;
  color: var(--color-muted);
}

.steps [aria-current] {
  color: var(--color-text);
  font-weight: 600;
}

.stock-message {
  margin: 0 0 1.25rem;
  padding: 0.6rem 0.85rem;
  border-left: 3px solid var(--color-danger);
  background: var(--color-surface-2);
  color: var(--color-danger);
  font-size: 0.88rem;
}

.empty-state,
.confirmation-state {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 3.5rem 1rem;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-muted);
}

.confirmation-state h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.4rem;
}

.empty-state p,
.confirmation-state p {
  margin: 0;
}

.browse-link {
  margin-top: 1rem;
}

.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 3.5rem;
  align-items: start;
}

.cart-lines {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-text);
}

.cart-line {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.cart-line img {
  width: 84px;
  height: 84px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--color-tile);
}

.line-category {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.line-info h2 {
  margin: 0.1rem 0 0;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
}

.line-price {
  margin: 0.1rem 0 0;
  font-size: 0.88rem;
  color: var(--color-muted);
}

.line-controls {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-items: end;
  gap: 0.5rem 0.75rem;
}

.line-total {
  grid-column: 1 / -1;
  grid-row: 1;
  justify-self: end;
  margin: 0;
  font-weight: 600;
}

.qty-field,
.remove-button {
  grid-row: 2;
}

.qty-field input {
  width: 72px;
  min-height: 44px;
  padding: 0 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font: inherit;
  color: var(--color-text);
  background: #fff;
}

.qty-field input:hover {
  border-color: var(--color-text);
}

.remove-button {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.85rem;
  color: var(--color-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.remove-button:hover {
  color: var(--color-danger);
}

.summary-panel {
  position: sticky;
  top: 125px;
  display: grid;
  gap: 1.1rem;
  padding: 1.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-2);
}

.summary-panel h2 {
  margin: 0;
  font-size: 1.1rem;
}

.promo-field {
  display: grid;
  gap: 0.4rem;
  font-size: 0.88rem;
  font-weight: 500;
}

.promo-input {
  display: flex;
  gap: 0.5rem;
}

.promo-input input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.promo-input input:hover {
  border-color: var(--color-text);
}

.promo-input .btn {
  min-height: 44px;
  padding: 0 1rem;
  font-size: 0.88rem;
}

.messages {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--color-danger);
}

.totals {
  display: grid;
  gap: 0.55rem;
  margin: 0;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.92rem;
}

.totals-row dt {
  color: var(--color-muted);
}

.totals-row dd {
  margin: 0;
}

.totals-row.discount dt,
.totals-row.discount dd {
  color: var(--color-success);
}

.totals-row.total {
  margin-top: 0.3rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-text);
}

.totals-row.total dt {
  color: var(--color-text);
  font-weight: 600;
}

.totals-row.total dd {
  font-size: 1.35rem;
  font-weight: 600;
}

.login-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-muted);
  text-align: center;
}

.checkout-button {
  min-height: 52px;
  font-size: 1rem;
}

.clear-button {
  justify-self: center;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.88rem;
  color: var(--color-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.clear-button:hover {
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .summary-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .cart-page {
    padding-inline: 1rem;
  }

  .cart-line {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 1rem;
  }

  .cart-line img {
    width: 72px;
    height: 72px;
  }

  .line-controls {
    grid-column: 1 / -1;
    grid-template-columns: auto 1fr auto;
    justify-items: start;
  }

  .line-total {
    grid-column: 3;
    grid-row: 1;
    justify-self: start;
  }
}
</style>
