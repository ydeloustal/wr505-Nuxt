import { describe, expect, it } from 'vitest'
import { formatDiscount, formatPrice } from '../../utils/format'

// Intl insère des espaces insécables : on les normalise pour comparer.
const normalize = (value: string) => value.replace(/\s/g, ' ')

describe('formatPrice', () => {
  it('affiche les montants entiers sans décimales', () => {
    expect(normalize(formatPrice(20))).toBe('20 €')
  })

  it('affiche deux décimales pour les montants non entiers', () => {
    expect(normalize(formatPrice(9.99))).toBe('9,99 €')
  })
})

describe('formatDiscount', () => {
  it('arrondit le pourcentage', () => {
    expect(formatDiscount(10.48)).toBe('−10 %')
    expect(formatDiscount(18.5)).toBe('−19 %')
  })
})
