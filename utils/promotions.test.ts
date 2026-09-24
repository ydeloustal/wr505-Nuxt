import { describe, expect, it } from 'vitest'
import { computeCart } from './promotions'

describe('computeCart', () => {
  it('applique les remises standards et informe quand le code est invalide', () => {
    const summary = computeCart(
      [
        { productId: 1, category: 'beauty', unitPriceCents: 1200, quantity: 2 },
        { productId: 2, category: 'beauty', unitPriceCents: 2000, quantity: 1 },
      ],
      'BEAUTY_3',
    )

    expect(summary.grossCents).toBe(4400)
    expect(summary.discounts).toEqual([
      { id: 'BEAUTY_3', label: 'BEAUTY_3', amountCents: 1320 },
    ])
    expect(summary.shippingCents).toBe(300)
    expect(summary.totalCents).toBe(3380)
    expect(summary.messages).toEqual([])
  })

  it('refuse un code promo inconnu', () => {
    const summary = computeCart(
      [{ productId: 1, category: 'beauty', unitPriceCents: 1000, quantity: 1 }],
      'INVALID',
    )

    expect(summary.discounts).toEqual([])
    expect(summary.messages).toContain('Code promo invalide : INVALID')
    expect(summary.totalCents).toBe(1000 + 300)
  })

  it('applique la remise TROYES10 quand le montant total est suffisant', () => {
    const summary = computeCart(
      [{ productId: 1, category: 'beauty', unitPriceCents: 1500, quantity: 3 }],
      'TROYES10',
    )

    expect(summary.grossCents).toBe(4500)
    expect(summary.discounts).toEqual([
      { id: 'TROYES10', label: 'TROYES10', amountCents: 450 },
    ])
    expect(summary.shippingCents).toBe(300)
    expect(summary.totalCents).toBe(4350)
  })
})
