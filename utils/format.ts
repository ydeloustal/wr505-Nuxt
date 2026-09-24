const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

const wholeCurrencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** Formate un montant en euros ; les montants entiers sont affichés sans décimales. */
export const formatPrice = (amount: number): string =>
  Number.isInteger(amount) ? wholeCurrencyFormatter.format(amount) : currencyFormatter.format(amount)

/** Arrondit un pourcentage de remise pour le badge « −X % ». */
export const formatDiscount = (percentage: number): string => `−${Math.round(percentage)} %`
