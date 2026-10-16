import { COMPARE_MAX, parseCompareIds, toggleCompare } from '~~/utils/compare'

const COMPARE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const useCompare = () => {
  const cookie = useCookie<string | number | null>('compare', {
    default: () => null,
    maxAge: COMPARE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  // Message lu par la région `aria-live` de la barre de comparaison (partagé entre tous les boutons).
  const message = useState<string>('compare-message', () => '')

  const ids = computed(() => parseCompareIds(cookie.value))
  const isSelected = (id: number) => ids.value.includes(id)

  const save = (next: number[]) => {
    cookie.value = next.length ? next.join(',') : null
  }

  const toggle = async (id: number) => {
    const result = toggleCompare(ids.value, id)

    // Vider puis réécrire après un tick : sans cela, un même texte annoncé deux fois de suite ne
    // changerait pas dans le DOM et le lecteur d'écran resterait muet la seconde fois.
    message.value = ''

    if (result.status === 'full') {
      await nextTick()
      message.value = `Vous pouvez comparer ${COMPARE_MAX} produits au maximum. Retirez-en un pour en ajouter un autre.`
    }
    else {
      save(result.ids)
    }

    return result.status
  }

  const clear = () => {
    save([])
    message.value = ''
  }

  return { ids, message, isSelected, toggle, clear }
}
