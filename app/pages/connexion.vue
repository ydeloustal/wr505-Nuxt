<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('emilys')
const password = ref('emilyspass')
const expiresInMins = ref(60)
const formError = ref<string | null>(null)
const submitting = ref(false)

const redirectTarget = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/'
})

// Déjà connecté (ex. onglet déjà ouvert) : inutile de rester sur le formulaire.
if (auth.isAuthenticated) {
  await navigateTo(redirectTarget.value)
}

const onSubmit = async () => {
  formError.value = null
  submitting.value = true

  try {
    await auth.login(username.value, password.value, expiresInMins.value)
    await router.push(redirectTarget.value)
  } catch {
    formError.value = auth.error ?? 'Connexion impossible.'
  } finally {
    submitting.value = false
  }
}

useSeoMeta({
  title: 'Connexion | ChampaShop',
  description: 'Connectez-vous à votre compte ChampaShop.',
})
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <p class="eyebrow">ChampaShop</p>
      <h1>Connexion</h1>
      <p class="hint">Compte de démonstration : <code>emilys</code> / <code>emilyspass</code></p>

      <form class="login-form" novalidate @submit.prevent="onSubmit">
        <label class="field">
          <span>Identifiant</span>
          <input v-model="username" type="text" name="username" autocomplete="username" required >
        </label>

        <label class="field">
          <span>Mot de passe</span>
          <input v-model="password" type="password" name="password" autocomplete="current-password" required >
        </label>

        <details class="advanced">
          <summary>Options avancées</summary>
          <label class="field">
            <span>Expiration du token (minutes)</span>
            <input v-model.number="expiresInMins" type="number" min="1" step="1" >
          </label>
        </details>

        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

        <button type="submit" class="submit-button" :disabled="submitting">
          {{ submitting ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  max-width: 440px;
  margin: 0 auto;
  padding: 3.5rem 1.25rem 4rem;
}

.login-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
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
  margin: 0.15rem 0 0.5rem;
  font-size: clamp(1.7rem, 4vw, 2.1rem);
  letter-spacing: -0.02em;
}

.hint {
  margin: 0 0 1.5rem;
  color: var(--color-muted);
  font-size: 0.85rem;
}

.hint code {
  background: #f3f2ee;
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.field input {
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font: inherit;
  background: #fafaf9;
  color: var(--color-text);
}

.field input:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 1px;
}

.advanced {
  font-size: 0.82rem;
  color: var(--color-muted);
}

.advanced summary {
  cursor: pointer;
  font-weight: 600;
}

.advanced .field {
  margin-top: 0.75rem;
}

.form-error {
  margin: 0;
  padding: 0.65rem 0.8rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: 0.85rem;
}

.submit-button {
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: white;
  padding: 0.85rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.submit-button:disabled {
  background: var(--color-muted);
  cursor: not-allowed;
}

.submit-button:focus-visible {
  outline: 3px solid var(--color-brand);
  outline-offset: 2px;
}
</style>
