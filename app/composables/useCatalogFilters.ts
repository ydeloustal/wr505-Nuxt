import { computed } from 'vue'
import { DEFAULT_FILTERS, parseCatalogQuery, toCatalogQuery, type CatalogFilters } from '~~/utils/catalog'

interface UpdateOptions {
  /** Remplace l'entrée d'historique au lieu d'en ajouter une (frappe dans la recherche). */
  replace?: boolean
}

/**
 * Filtres du catalogue dont l'URL est la seule source de vérité : ils sont lus depuis les query
 * params et toute modification passe par une navigation. Rechargement, bouton retour et lien
 * partagé reproduisent donc la même vue.
 */
export function useCatalogFilters() {
  const route = useRoute()
  const router = useRouter()

  const filters = computed(() => parseCatalogQuery(route.query))

  const update = (patch: Partial<CatalogFilters>, { replace = false }: UpdateOptions = {}) => {
    const next = { ...filters.value, ...patch }
    // Tout changement de filtre repart de la première page, sauf navigation explicite.
    if (!('page' in patch)) next.page = 1

    const location = { query: toCatalogQuery(next) }
    return replace ? router.replace(location) : router.push(location)
  }

  const reset = () => update(DEFAULT_FILTERS)

  return { filters, update, reset }
}
