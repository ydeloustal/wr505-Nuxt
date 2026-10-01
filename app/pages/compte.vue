<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const router = useRouter()

const onLogout = () => {
  auth.logout()
  router.push('/')
}

useSeoMeta({
  title: 'Mon compte | ChampaShop',
  description: 'Informations de votre compte ChampaShop.',
})
</script>

<template>
  <main class="account-page">
    <section v-if="auth.user" class="account-card">
      <img :src="auth.user.image" :alt="`Avatar de ${auth.user.firstName}`" class="avatar" >

      <div class="account-info">
        <p class="eyebrow">ChampaShop</p>
        <h1>{{ auth.user.firstName }} {{ auth.user.lastName }}</h1>
        <dl>
          <div>
            <dt>Identifiant</dt>
            <dd>{{ auth.user.username }}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{{ auth.user.email }}</dd>
          </div>
        </dl>

        <button type="button" class="logout-button" @click="onLogout">Déconnexion</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.account-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 3.5rem 1.25rem 4rem;
}

.account-card {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 999px;
  object-fit: cover;
  background: #f3f2ee;
  flex-shrink: 0;
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
  margin: 0.15rem 0 1rem;
  font-size: clamp(1.5rem, 3.5vw, 1.9rem);
  letter-spacing: -0.02em;
}

dl {
  display: grid;
  gap: 0.4rem;
  margin: 0 0 1.25rem;
}

dl div {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

dt {
  min-width: 6rem;
  font-weight: 700;
  color: var(--color-muted);
}

dd {
  margin: 0;
}

.logout-button {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-danger);
  padding: 0.65rem 1.1rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.logout-button:hover {
  background: #fef2f2;
}

.logout-button:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .account-card {
    flex-direction: column;
    text-align: center;
  }

  dl div {
    justify-content: center;
  }
}
</style>
