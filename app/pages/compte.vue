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

        <button type="button" class="btn ghost logout-button" @click="onLogout">Déconnexion</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.account-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem 4rem;
}

.account-card {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: var(--color-tile);
  flex-shrink: 0;
}

h1 {
  margin: 0 0 1rem;
  font-size: 1.7rem;
  letter-spacing: -0.02em;
}

dl {
  margin: 0 0 1.25rem;
  border-top: 1px solid var(--color-text);
}

dl div {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.92rem;
}

dt {
  color: var(--color-muted);
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .account-page {
    padding-inline: 1rem;
  }

  .account-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
