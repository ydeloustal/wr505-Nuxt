import type { Product } from '~~/types/dummyjson'

export const LOW_STOCK_THRESHOLD = 5
const SEO_DESCRIPTION_MAX_LENGTH = 160

export interface StockState {
  status: 'out' | 'low' | 'ok'
  label: string
}

export interface ProductSeo {
  title: string
  description: string
  image: string
}

/** Message de stock : « Rupture de stock » à 0, « Plus que X en stock » sous le seuil. */
export const getStockState = (stock: number): StockState => {
  if (stock <= 0) return { status: 'out', label: 'Rupture de stock' }
  if (stock < LOW_STOCK_THRESHOLD) return { status: 'low', label: `Plus que ${stock} en stock` }
  return { status: 'ok', label: 'En stock' }
}

/** Tronque sans couper un mot en deux et ajoute une ellipse si le texte est raccourci. */
export const truncateText = (text: string, maxLength: number): string => {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (clean.length <= maxLength) return clean

  const cut = clean.slice(0, maxLength - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/** Toutes les images d'un produit, sans doublon, avec la miniature en repli. */
export const getProductImages = (product: Pick<Product, 'images' | 'thumbnail'>): string[] => {
  const images = product.images.length > 0 ? product.images : [product.thumbnail]
  return [...new Set(images.filter(Boolean))]
}

/** Métadonnées SEO (titre, description, image Open Graph) d'une fiche produit. */
export const buildProductSeo = (
  product: Pick<Product, 'title' | 'description' | 'images' | 'thumbnail'>,
): ProductSeo => ({
  title: `${product.title} | ChampaShop`,
  description: truncateText(product.description, SEO_DESCRIPTION_MAX_LENGTH),
  image: product.thumbnail || product.images[0] || '',
})
