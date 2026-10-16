export const COMPARE_MAX = 3

export type CompareToggleStatus = 'added' | 'removed' | 'full'

export interface CompareToggleResult {
  ids: number[]
  status: CompareToggleStatus
}

/**
 * Lit la valeur brute du cookie `compare` (« 1,2,3 », tableau, nombre seul que `useCookie` a pu
 * décoder en JSON, ou valeur absente) et renvoie une liste d'identifiants sûre : entiers positifs,
 * sans doublon, limitée à `max` éléments. Toute entrée illisible donne une liste vide.
 */
export const parseCompareIds = (raw: unknown, max = COMPARE_MAX): number[] => {
  let parts: unknown[]

  if (Array.isArray(raw)) parts = raw
  else if (typeof raw === 'string') parts = raw.split(',')
  else if (typeof raw === 'number') parts = [raw]
  else return []

  const ids: number[] = []

  for (const part of parts) {
    const id = typeof part === 'string' ? Number(part.trim() || Number.NaN) : part
    if (typeof id === 'number' && Number.isInteger(id) && id > 0 && !ids.includes(id)) ids.push(id)
  }

  return ids.slice(0, max)
}

/**
 * Ajoute `id` à la sélection s'il n'y est pas, le retire s'il y est déjà. Quand la sélection est
 * pleine, elle est renvoyée telle quelle avec le statut `full` pour que l'interface puisse annoncer
 * le refus. Ne modifie pas le tableau reçu.
 */
export const toggleCompare = (ids: number[], id: number, max = COMPARE_MAX): CompareToggleResult => {
  if (ids.includes(id)) return { ids: ids.filter(current => current !== id), status: 'removed' }
  if (ids.length >= max) return { ids: [...ids], status: 'full' }
  return { ids: [...ids, id], status: 'added' }
}
