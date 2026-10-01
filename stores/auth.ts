import { FetchError } from 'ofetch'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthLoginResponse, AuthTokens, AuthUser } from '~~/types/dummyjson'

interface AuthFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'
const DEFAULT_EXPIRES_IN_MINS = 60
// expiresInMins du refresh : garder la session active sans la prolonger indéfiniment à chaque appel.
const REFRESH_EXPIRES_IN_MINS = 60

const isUnauthorized = (error: unknown): boolean =>
  error instanceof FetchError && (error.response?.status === 401 || error.statusCode === 401)

export const useAuthStore = defineStore('auth', () => {
  const { public: { apiBase } } = useRuntimeConfig()

  // Cookies : disponibles côté serveur dès la requête, pour charger l'utilisateur sans "flash"
  // de l'état déconnecté au premier rendu (voir le plugin app/plugins/auth.ts).
  const accessToken = useCookie<string | null>(ACCESS_TOKEN_COOKIE, { sameSite: 'lax', default: () => null })
  const refreshToken = useCookie<string | null>(REFRESH_TOKEN_COOKIE, { sameSite: 'lax', default: () => null })

  const user = ref<AuthUser | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  // Portée au store (donc à la requête en SSR, et à l'onglet côté client) : jamais partagée entre
  // deux utilisateurs différents, contrairement à une variable de module.
  let refreshPromise: Promise<boolean> | null = null

  function setSession(tokens: AuthTokens) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
  }

  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  /**
   * Rejoue un seul appel à /auth/refresh même si plusieurs requêtes échouent en 401 en même temps :
   * la première déclenche l'appel, les suivantes attendent la même promesse au lieu d'en relancer une.
   */
  async function refreshTokens(): Promise<boolean> {
    if (!refreshToken.value) return false

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const tokens = await $fetch<AuthTokens>('/auth/refresh', {
            baseURL: apiBase,
            method: 'POST',
            body: { refreshToken: refreshToken.value, expiresInMins: REFRESH_EXPIRES_IN_MINS },
          })
          setSession(tokens)
          return true
        } catch {
          clearSession()
          return false
        } finally {
          refreshPromise = null
        }
      })()
    }

    return refreshPromise
  }

  /** Appel authentifié avec le token courant ; sur 401, rafraîchit puis rejoue une seule fois. */
  async function authFetch<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
    const run = (token: string | null) =>
      $fetch<T>(path, {
        method: options.method ?? 'GET',
        body: options.body,
        baseURL: apiBase,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

    try {
      return await run(accessToken.value)
    } catch (cause) {
      if (!isUnauthorized(cause)) throw cause

      const refreshed = await refreshTokens()
      if (!refreshed) throw cause

      return run(accessToken.value)
    }
  }

  async function fetchMe(): Promise<void> {
    if (!accessToken.value) {
      user.value = null
      return
    }

    try {
      user.value = await authFetch<AuthUser>('/auth/me')
    } catch {
      clearSession()
    }
  }

  async function login(username: string, password: string, expiresInMins = DEFAULT_EXPIRES_IN_MINS): Promise<void> {
    pending.value = true
    error.value = null

    try {
      const response = await $fetch<AuthLoginResponse>('/auth/login', {
        baseURL: apiBase,
        method: 'POST',
        body: { username, password, expiresInMins },
      })

      const { accessToken: accessTokenValue, refreshToken: refreshTokenValue, ...profile } = response
      setSession({ accessToken: accessTokenValue, refreshToken: refreshTokenValue })
      user.value = profile
    } catch (cause) {
      error.value = cause instanceof FetchError && cause.response?.status === 400
        ? 'Identifiant ou mot de passe incorrect.'
        : 'Connexion impossible pour le moment.'
      throw cause
    } finally {
      pending.value = false
    }
  }

  function logout() {
    clearSession()
  }

  return { user, isAuthenticated, pending, error, login, logout, fetchMe, authFetch }
})
