import { describe, expect, it } from 'vitest'
import { parseRecentlyViewed, recordView, RECENTLY_VIEWED_MAX } from '../../utils/recentlyViewed'

describe('parseRecentlyViewed', () => {
  it('lit une liste séparée par des virgules, du plus récent au plus ancien', () => {
    expect(parseRecentlyViewed('9,4,7')).toEqual([9, 4, 7])
  })

  it('accepte un nombre seul ou un tableau (décodage JSON de useCookie)', () => {
    expect(parseRecentlyViewed(12)).toEqual([12])
    expect(parseRecentlyViewed([3, '5'])).toEqual([3, 5])
  })

  it('renvoie une liste vide pour un cookie absent ou illisible', () => {
    expect(parseRecentlyViewed(undefined)).toEqual([])
    expect(parseRecentlyViewed('abc,-1,0')).toEqual([])
  })

  it('supprime les doublons et limite la liste au maximum', () => {
    expect(parseRecentlyViewed('1,2,1,3,4,5,6,7,8')).toHaveLength(RECENTLY_VIEWED_MAX)
    expect(parseRecentlyViewed('1,2,1,3', 2)).toEqual([1, 2])
  })
})

describe('recordView', () => {
  it('place un nouveau produit en tête', () => {
    expect(recordView([2, 3], 1)).toEqual([1, 2, 3])
    expect(recordView([], 5)).toEqual([5])
  })

  it('remonte en tête un produit déjà vu, sans le dupliquer', () => {
    expect(recordView([1, 2, 3], 3)).toEqual([3, 1, 2])
    expect(recordView([1, 2, 3], 1)).toEqual([1, 2, 3])
  })

  it('oublie les plus anciens au-delà du maximum', () => {
    expect(recordView([1, 2, 3], 4, 3)).toEqual([4, 1, 2])
    expect(recordView([1, 2, 3, 4, 5, 6], 7)).toEqual([7, 1, 2, 3, 4, 5])
  })

  it('ne modifie pas le tableau reçu', () => {
    const ids = [1, 2, 3]
    recordView(ids, 2)
    expect(ids).toEqual([1, 2, 3])
  })
})
