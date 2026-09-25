import { describe, expect, it } from 'vitest'
import { computeCart, type CartLine } from '../../utils/promotions'

describe('computeCart', () => {
  it('applique -10 % sur les lignes beauty dès 3 articles cumulés', () => {
    const lines: CartLine[] = [{ productId: 1, category: 'beauty', unitPriceCents: 1000, quantity: 3 }]

    const summary = computeCart(lines)

    expect(summary.grossCents).toBe(3000)
    expect(summary.discounts).toEqual([
      { id: 'BEAUTY_3', label: 'Remise beauté (-10 %)', amountCents: 300 },
    ])
    expect(summary.messages).toEqual([])
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(3190)
  })

  it("n'applique pas la remise beauté en dessous de 3 articles", () => {
    const lines: CartLine[] = [{ productId: 1, category: 'beauty', unitPriceCents: 1000, quantity: 2 }]

    const summary = computeCart(lines)

    expect(summary.discounts).toEqual([])
    expect(summary.totalCents).toBe(2000 + 490)
  })

  it('applique TROYES10 (insensible à la casse et aux espaces) quand le sous-total dépasse 50 €', () => {
    const lines: CartLine[] = [{ productId: 2, category: 'electronics', unitPriceCents: 6000, quantity: 1 }]

    const summary = computeCart(lines, '  TrOyEs10  ')

    expect(summary.grossCents).toBe(6000)
    expect(summary.discounts).toEqual([{ id: 'TROYES10', label: 'Code TROYES10', amountCents: 1000 }])
    expect(summary.messages).toEqual([])
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(5490)
  })

  it('refuse TROYES10 quand le sous-total ne dépasse pas strictement 50 €', () => {
    const lines: CartLine[] = [{ productId: 2, category: 'electronics', unitPriceCents: 5000, quantity: 1 }]

    const summary = computeCart(lines, 'TROYES10')

    expect(summary.discounts).toEqual([])
    expect(summary.messages).toEqual([
      'Code promo TROYES10 : le sous-total après remise beauté doit dépasser 50,00 €',
    ])
    expect(summary.totalCents).toBe(5490)
  })

  it('refuse un code promo inconnu et conserve la casse saisie dans le message', () => {
    const lines: CartLine[] = [{ productId: 1, category: 'beauty', unitPriceCents: 1000, quantity: 1 }]

    const summary = computeCart(lines, 'invalid')

    expect(summary.discounts).toEqual([])
    expect(summary.messages).toEqual(['Code promo invalide : invalid'])
  })

  it('plafonne les remises à 25 % du sous-total brut en réduisant le code promo', () => {
    const lines: CartLine[] = [{ productId: 1, category: 'beauty', unitPriceCents: 2000, quantity: 3 }]

    const summary = computeCart(lines, 'TROYES10')

    expect(summary.grossCents).toBe(6000)
    expect(summary.discounts).toEqual([
      { id: 'BEAUTY_3', label: 'Remise beauté (-10 %)', amountCents: 600 },
      { id: 'TROYES10', label: 'Code TROYES10', amountCents: 900 },
    ])
    expect(summary.messages).toEqual([
      'Code promo TROYES10 : remise réduite à 9.00 € pour respecter le plafond de 25 % de remise',
    ])
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(4990)
  })

  it('offre la livraison à partir de 80 € après remises', () => {
    const lines: CartLine[] = [{ productId: 3, category: 'electronics', unitPriceCents: 9000, quantity: 1 }]

    const summary = computeCart(lines)

    expect(summary.shippingCents).toBe(0)
    expect(summary.totalCents).toBe(9000)
  })

  it('facture toujours la livraison si le panier contient un produit furniture', () => {
    const lines: CartLine[] = [{ productId: 4, category: 'furniture', unitPriceCents: 9000, quantity: 1 }]

    const summary = computeCart(lines)

    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(9490)
  })

  it('gère un panier vide sans erreur', () => {
    const summary = computeCart([])

    expect(summary.grossCents).toBe(0)
    expect(summary.discounts).toEqual([])
    expect(summary.messages).toEqual([])
    expect(summary.shippingCents).toBe(490)
    expect(summary.totalCents).toBe(490)
  })

  it('ignore les lignes à quantité 0', () => {
    const lines: CartLine[] = [
      { productId: 1, category: 'beauty', unitPriceCents: 1000, quantity: 0 },
      { productId: 2, category: 'beauty', unitPriceCents: 1000, quantity: 3 },
    ]

    const summary = computeCart(lines)

    expect(summary.grossCents).toBe(3000)
    expect(summary.discounts).toEqual([
      { id: 'BEAUTY_3', label: 'Remise beauté (-10 %)', amountCents: 300 },
    ])
  })

  it('ignore un code promo composé uniquement d’espaces', () => {
    const lines: CartLine[] = [{ productId: 1, category: 'electronics', unitPriceCents: 6000, quantity: 1 }]

    const summary = computeCart(lines, '   ')

    expect(summary.discounts).toEqual([])
    expect(summary.messages).toEqual([])
  })
})
