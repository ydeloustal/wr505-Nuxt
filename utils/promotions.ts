export interface CartLine {
  productId: number
  category: string
  unitPriceCents: number
  quantity: number
}

export interface AppliedDiscount {
  id: 'BEAUTY_3' | 'TROYES10'
  label: string
  amountCents: number
}

export interface CartSummary {
  grossCents: number
  discounts: AppliedDiscount[]
  shippingCents: number
  totalCents: number
  messages: string[]
}

function normalizeCode(code?: string): string | undefined {
  return code?.trim().toUpperCase() || undefined
}

export function computeCart(lines: CartLine[], promoCode?: string): CartSummary {
  const normalizedCode = normalizeCode(promoCode)
  const grossCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const discountList: AppliedDiscount[] = []
  const messages: string[] = []

  if (normalizedCode) {
    switch (normalizedCode) {
      case 'BEAUTY_3': {
        const beautyLines = lines.filter((line) => line.category.toLowerCase() === 'beauty')
        const beautyQuantity = beautyLines.reduce((sum, line) => sum + line.quantity, 0)
        const beautySubtotal = beautyLines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)

        if (beautyQuantity < 3) {
          messages.push('Code promo BEAUTY_3 : il faut au moins 3 articles beauty dans le panier')
        } else {
          const amountCents = Math.floor(beautySubtotal * 0.3)
          discountList.push({ id: 'BEAUTY_3', label: 'BEAUTY_3', amountCents })
        }
        break
      }

      case 'TROYES10': {
        if (grossCents < 4500) {
          messages.push('Code promo TROYES10 : le panier doit dépasser 45,00 €')
        } else {
          const amountCents = Math.floor(grossCents * 0.1)
          discountList.push({ id: 'TROYES10', label: 'TROYES10', amountCents })
        }
        break
      }

      default:
        messages.push(`Code promo invalide : ${promoCode}`)
    }
  }

  const shippingCents = 300
  const discountsAmount = discountList.reduce((sum, discount) => sum + discount.amountCents, 0)
  const totalCents = Math.max(0, grossCents - discountsAmount + shippingCents)

  return {
    grossCents,
    discounts: discountList,
    shippingCents,
    totalCents,
    messages,
  }
}
