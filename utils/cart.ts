interface MergeableLine {
  productId: number
  quantity: number
  stock: number
}

/**
 * Fusionne deux paniers (ex. panier invité versé dans celui du compte à la connexion) : les lignes
 * du même produit sont cumulées, sans jamais dépasser le stock connu le plus récent (`incoming`).
 * Ne modifie aucun des deux tableaux reçus.
 */
export const mergeCartItems = <T extends MergeableLine>(target: T[], incoming: T[]): T[] => {
  const merged = target.map(item => ({ ...item }))

  for (const line of incoming) {
    const existing = merged.find(item => item.productId === line.productId)

    if (existing) {
      existing.stock = line.stock
      existing.quantity = Math.min(existing.quantity + line.quantity, line.stock)
    }
    else {
      merged.push({ ...line, quantity: Math.min(line.quantity, line.stock) })
    }
  }

  return merged.filter(item => item.quantity > 0)
}
