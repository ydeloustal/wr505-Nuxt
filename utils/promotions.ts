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

const TROYES10_THRESHOLD_CENTS = 5000
const TROYES10_AMOUNT_CENTS = 1000
const BEAUTY_MIN_QUANTITY = 3
const BEAUTY_RATE = 0.1
const DISCOUNT_CAP_RATE = 0.25
const SHIPPING_CENTS = 490
const FREE_SHIPPING_THRESHOLD_CENTS = 8000

// Arrondi commercial (demi vers le haut) : Math.round se comporte ainsi pour des
// valeurs positives, ce qui est toujours le cas ici (prix et quantites >= 0).
const roundHalfUp = (value: number) => Math.round(value)

function normalizeCode(code?: string): string | undefined {
  return code?.trim().toUpperCase() || undefined
}

function lineTotalCents(line: CartLine): number {
  return line.unitPriceCents * line.quantity
}

export function computeCart(lines: CartLine[], promoCode?: string): CartSummary {
  const messages: string[] = []
  const grossCents = lines.reduce((sum, line) => sum + lineTotalCents(line), 0)

  // 1. Remise beauté automatique : -10 % sur chaque ligne beauty, arrondie ligne
  // par ligne, dès que 3 articles beauty (quantités cumulées) sont dans le panier.
  const beautyLines = lines.filter((line) => line.category.toLowerCase() === 'beauty')
  const beautyQuantity = beautyLines.reduce((sum, line) => sum + line.quantity, 0)
  const beautyDiscountCents =
    beautyQuantity >= BEAUTY_MIN_QUANTITY
      ? beautyLines.reduce((sum, line) => sum + roundHalfUp(lineTotalCents(line) * BEAUTY_RATE), 0)
      : 0

  const subtotalAfterBeauty = grossCents - beautyDiscountCents

  // 2. Code TROYES10 : -10,00 € si le sous-total après remise beauté dépasse 50 €.
  const normalizedCode = normalizeCode(promoCode)
  let promoDiscountCents = 0

  if (normalizedCode) {
    if (normalizedCode === 'TROYES10') {
      if (subtotalAfterBeauty > TROYES10_THRESHOLD_CENTS) {
        promoDiscountCents = TROYES10_AMOUNT_CENTS
      } else {
        messages.push('Code promo TROYES10 : le sous-total après remise beauté doit dépasser 50,00 €')
      }
    } else {
      messages.push(`Code promo invalide : ${promoCode}`)
    }
  }

  // 3. Plafond : le total des remises ne dépasse jamais 25 % du sous-total brut.
  // En cas de dépassement, c'est le code promo qui est réduit (jamais la remise beauté).
  const discountCapCents = roundHalfUp(grossCents * DISCOUNT_CAP_RATE)
  const totalDiscountBeforeCap = beautyDiscountCents + promoDiscountCents

  if (totalDiscountBeforeCap > discountCapCents) {
    const overflow = totalDiscountBeforeCap - discountCapCents
    const reducedPromoDiscountCents = Math.max(0, promoDiscountCents - overflow)

    if (reducedPromoDiscountCents !== promoDiscountCents) {
      messages.push(
        `Code promo TROYES10 : remise réduite à ${(reducedPromoDiscountCents / 100).toFixed(2)} € pour respecter le plafond de 25 % de remise`,
      )
    }

    promoDiscountCents = reducedPromoDiscountCents
  }

  const discounts: AppliedDiscount[] = []
  if (beautyDiscountCents > 0) {
    discounts.push({ id: 'BEAUTY_3', label: 'Remise beauté (-10 %)', amountCents: beautyDiscountCents })
  }
  if (promoDiscountCents > 0) {
    discounts.push({ id: 'TROYES10', label: 'Code TROYES10', amountCents: promoDiscountCents })
  }

  const totalDiscountCents = beautyDiscountCents + promoDiscountCents
  const amountAfterDiscounts = grossCents - totalDiscountCents

  // 4. Livraison : 4,90 €, offerte à partir de 80 € après remises, sauf présence de furniture.
  const hasFurniture = lines.some((line) => line.category.toLowerCase() === 'furniture' && line.quantity > 0)
  const shippingCents =
    !hasFurniture && amountAfterDiscounts >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS

  const totalCents = Math.max(0, amountAfterDiscounts + shippingCents)

  return {
    grossCents,
    discounts,
    shippingCents,
    totalCents,
    messages,
  }
}
