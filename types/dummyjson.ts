export interface Review {
  rating: number
  comment: string
  date: string
  reviewerName: string
  reviewerEmail: string
}

export interface Product {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  tags: string[]
  brand?: string
  sku: string
  weight: number
  warrantyInformation: string
  shippingInformation: string
  availabilityStatus: string
  reviews: Review[]
  returnPolicy: string
  minimumOrderQuantity: number
  thumbnail: string
  images: string[]
}

/** Champs nécessaires à la liste du catalogue : évite de charger les avis, images, etc. */
export type ProductSummary = Pick<
  Product,
  'id' | 'title' | 'price' | 'rating' | 'discountPercentage' | 'category' | 'thumbnail'
>

export interface ProductsResponse<T = Product> {
  products: T[]
  total: number
  skip: number
  limit: number
}

export interface Category {
  slug: string
  name: string
  url: string
}
