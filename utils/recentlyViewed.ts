import { parseCompareIds } from './compare'

export const RECENTLY_VIEWED_MAX = 6

/**
 * Lit la valeur brute du cookie `recently_viewed` (même format que `compare` : « 4,8,15 », tableau
 * ou nombre seul) : entiers positifs, sans doublon, du plus récent au plus ancien, limités à `max`.
 */
export const parseRecentlyViewed = (raw: unknown, max = RECENTLY_VIEWED_MAX): number[] =>
  parseCompareIds(raw, max)

/**
 * Place `id` en tête de l'historique (un produit déjà vu remonte au lieu d'être dupliqué) et
 * oublie les plus anciens au-delà de `max`. Ne modifie pas le tableau reçu.
 */
export const recordView = (ids: number[], id: number, max = RECENTLY_VIEWED_MAX): number[] =>
  [id, ...ids.filter(current => current !== id)].slice(0, max)
