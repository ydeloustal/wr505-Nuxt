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
const showPassword = ref(false)

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
      <div>
        <h1>Connexion</h1>
        <p class="sub">Identifiez-vous pour valider votre commande.</p>
      </div>

      <p class="hint">Compte de démonstration<br><code>emilys / emilyspass</code></p>

      <form class="login-form" novalidate @submit.prevent="onSubmit">
        <label class="field">
          <span>Identifiant</span>
          <input v-model="username" type="text" name="username" autocomplete="username" required >
        </label>

        <div class="field">
          <label for="login-password">Mot de passe</label>
          <div class="control">
            <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" name="password" autocomplete="current-password" required >
            <button type="button" class="toggle" :aria-pressed="showPassword" @click="showPassword = !showPassword">
              {{ showPassword ? 'Masquer' : 'Afficher' }}
            </button>
          </div>
        </div>

        <details class="advanced">
          <summary>Options avancées</summary>
          <label class="field">
            <span>Expiration du token (minutes)</span>
            <input v-model.number="expiresInMins" type="number" min="1" step="1" >
          </label>
        </details>

        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

        <button type="submit" class="btn submit-button" :disabled="submitting">
          {{ submitting ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  justify-items: center;
  padding: 4rem 1.5rem 4rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  display: grid;
  gap: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.9rem;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0.3rem 0 0;
  color: var(--color-muted);
}

.hint {
  margin: 0;
  padding: 0.75rem 1rem;
  border-left: 3px solid var(--color-link);
  background: var(--color-surface-2);
  font-size: 0.88rem;
}

.hint code {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.login-form {
  display: grid;
  gap: 1.1rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field > span,
.field > label {
  font-size: 0.9rem;
  font-weight: 500;
}

.control {
  position: relative;
}

.field input {
  width: 100%;
  min-height: 48px;
  padding: 0 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  font: inherit;
  color: var(--color-text);
}

.control input {
  padding-right: 6rem;
}

.field input:hover {
  border-color: var(--color-text);
}

.field input:focus {
  outline: 2px solid var(--color-link);
  outline-offset: 1px;
  border-color: var(--color-link);
}

.toggle {
  position: absolute;
  right: 2px;
  top: 2px;
  min-height: 44px;
  padding: 0 0.75rem;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.advanced {
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.advanced summary {
  display: flex;
  align-items: center;
  min-height: 44px;
  font-size: 0.9rem;
  color: var(--color-muted);
  cursor: pointer;
}

.advanced[open] summary {
  margin-bottom: 0.5rem;
}

.form-error {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-left: 3px solid var(--color-danger);
  background: var(--color-surface-2);
  color: var(--color-danger);
  font-size: 0.88rem;
}

.submit-button {
  min-height: 52px;
  font-size: 1rem;
}

@media (max-width: 640px) {
  .login-page {
    padding: 2rem 1rem;
  }
}
</style>
