import { describe, expect, it } from 'vitest'
import { COMPARE_MAX, parseCompareIds, toggleCompare } from '../../utils/compare'

describe('parseCompareIds', () => {
  it('lit une liste séparée par des virgules', () => {
    expect(parseCompareIds('4,8,15')).toEqual([4, 8, 15])
  })

  it('accepte un tableau et un nombre seul (décodage JSON de useCookie)', () => {
    expect(parseCompareIds([4, '8'])).toEqual([4, 8])
    expect(parseCompareIds(12)).toEqual([12])
  })

  it('renvoie une liste vide pour une valeur absente ou d’un autre type', () => {
    expect(parseCompareIds(undefined)).toEqual([])
    expect(parseCompareIds(null)).toEqual([])
    expect(parseCompareIds('')).toEqual([])
    expect(parseCompareIds({ ids: [1] })).toEqual([])
  })

  it('écarte les valeurs invalides : texte, décimaux, zéro, négatifs, éléments vides', () => {
    expect(parseCompareIds('abc,1.5,0,-2,,7, 9 ,NaN')).toEqual([7, 9])
    expect(parseCompareIds([null, true, Infinity, 3])).toEqual([3])
  })

  it('supprime les doublons en gardant le premier', () => {
    expect(parseCompareIds('3,5,3,5,6')).toEqual([3, 5, 6])
  })

  it('limite la liste à 3 produits par défaut, ou au maximum donné', () => {
    expect(COMPARE_MAX).toBe(3)
    expect(parseCompareIds('1,2,3,4,5')).toEqual([1, 2, 3])
    expect(parseCompareIds('1,2,3,4,5', 2)).toEqual([1, 2])
  })
})

describe('toggleCompare', () => {
  it('ajoute un produit absent à la suite de la sélection', () => {
    expect(toggleCompare([1], 2)).toEqual({ ids: [1, 2], status: 'added' })
    expect(toggleCompare([], 5)).toEqual({ ids: [5], status: 'added' })
  })

  it('retire un produit déjà sélectionné', () => {
    expect(toggleCompare([1, 2, 3], 2)).toEqual({ ids: [1, 3], status: 'removed' })
  })

  it('permet de retirer un produit même quand la sélection est pleine', () => {
    expect(toggleCompare([1, 2, 3], 3).status).toBe('removed')
  })

  it('refuse un 4ᵉ produit : sélection inchangée et statut « full »', () => {
    expect(toggleCompare([1, 2, 3], 4)).toEqual({ ids: [1, 2, 3], status: 'full' })
  })

  it('respecte un maximum personnalisé', () => {
    expect(toggleCompare([1], 2, 1)).toEqual({ ids: [1], status: 'full' })
  })

  it('ne modifie pas le tableau reçu', () => {
    const ids = [1, 2, 3]
    const refused = toggleCompare(ids, 4)
    toggleCompare(ids, 1)
    expect(ids).toEqual([1, 2, 3])
    expect(refused.ids).not.toBe(ids)
  })
})
