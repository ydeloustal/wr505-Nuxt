import { describe, expect, it } from 'vitest'
import { mergeCartItems } from '../../utils/cart'

const line = (productId: number, quantity: number, stock = 10) => ({ productId, quantity, stock, title: `Produit ${productId}` })

describe('mergeCartItems', () => {
  it('reprend le panier invité quand le panier du compte est vide', () => {
    expect(mergeCartItems([], [line(1, 2), line(2, 1)])).toEqual([line(1, 2), line(2, 1)])
  })

  it('garde le panier du compte quand le panier invité est vide', () => {
    expect(mergeCartItems([line(1, 2)], [])).toEqual([line(1, 2)])
  })

  it('cumule les quantités d’un même produit et ajoute les autres lignes à la suite', () => {
    expect(mergeCartItems([line(1, 2), line(3, 1)], [line(1, 3), line(2, 1)])).toEqual([line(1, 5), line(3, 1), line(2, 1)])
  })

  it('plafonne la quantité cumulée au stock le plus récent', () => {
    expect(mergeCartItems([line(1, 4, 10)], [line(1, 3, 5)])).toEqual([line(1, 5, 5)])
  })

  it('plafonne une nouvelle ligne à son stock et écarte les lignes sans quantité', () => {
    expect(mergeCartItems([], [line(1, 8, 3), line(2, 2, 0)])).toEqual([line(1, 3, 3)])
  })

  it('ne modifie pas les tableaux reçus', () => {
    const target = [line(1, 2)]
    const incoming = [line(1, 3)]
    mergeCartItems(target, incoming)
    expect(target).toEqual([line(1, 2)])
    expect(incoming).toEqual([line(1, 3)])
  })
})
