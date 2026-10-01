import { useAuthStore } from '~~/stores/auth'

/**
 * Charge l'utilisateur avant le premier rendu (SSR comme CSR) : pas de "flash" de l'état
 * déconnecté le temps qu'un appel /auth/me reparte côté client. L'état Pinia hydraté depuis le
 * payload serveur évite un second appel si l'utilisateur est déjà chargé.
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  if (!auth.user) await auth.fetchMe()
})
