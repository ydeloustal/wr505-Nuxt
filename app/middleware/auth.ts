import { useAuthStore } from '~~/stores/auth'

/** Protège une route : redirige vers /connexion en conservant la page demandée. */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/connexion', query: { redirect: to.fullPath } })
  }
})
