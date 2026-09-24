import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

export const SEARCH_DEBOUNCE_MS = 300

/**
 * Champ de saisie synchronisé avec une source externe (l'URL) : la valeur saisie n'est propagée
 * via `commit` qu'après `delay` ms sans frappe, et un changement de la source (retour arrière,
 * lien partagé) met à jour le champ immédiatement.
 */
export function useDebouncedSync(
  source: MaybeRefOrGetter<string>,
  commit: (value: string) => void,
  delay = SEARCH_DEBOUNCE_MS,
): Ref<string> {
  const input = ref(toValue(source))
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(() => toValue(source), (value) => {
    input.value = value
  })

  watch(input, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const trimmed = value.trim()
      if (trimmed !== toValue(source)) commit(trimmed)
    }, delay)
  })

  onScopeDispose(() => clearTimeout(timer))

  return input
}
