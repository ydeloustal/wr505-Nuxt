export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: { strict: true, typeCheck: true },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
})
