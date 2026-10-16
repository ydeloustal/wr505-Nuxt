import { parseRecentlyViewed, recordView } from '~~/utils/recentlyViewed'

const RECENTLY_VIEWED_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const useRecentlyViewed = () => {
  const cookie = useCookie<string | number | null>('recently_viewed', {
    default: () => null,
    maxAge: RECENTLY_VIEWED_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const ids = computed(() => parseRecentlyViewed(cookie.value))

  const record = (id: number) => {
    cookie.value = recordView(ids.value, id).join(',')
  }

  const clear = () => {
    cookie.value = null
  }

  return { ids, record, clear }
}
