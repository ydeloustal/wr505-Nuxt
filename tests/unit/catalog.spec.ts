import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  countByCategory,
  filterProducts,
  getPageWindow,
  getPriceCeiling,
  paginate,
  parseCatalogQuery,
  sortProducts,
  toCatalogQuery,
} from '../../utils/catalog'
import type { ProductSummary } from '../../types/dummyjson'

const makeProduct = (overrides: Partial<ProductSummary> & { id: number }): ProductSummary => ({
  title: `Produit ${overrides.id}`,
  price: 10,
  rating: 4,
  discountPercentage: 0,
  category: 'beauty',
  thumbnail: '',
  ...overrides,
})

const products: ProductSummary[] = [
  makeProduct({ id: 1, title: 'Étui', price: 12.5, rating: 3.2, category: 'beauty' }),
  makeProduct({ id: 2, title: 'Zèbre', price: 99, rating: 4.8, category: 'furniture' }),
  makeProduct({ id: 3, title: 'Abricot', price: 5, rating: 4.1, category: 'groceries' }),
  makeProduct({ id: 4, title: 'Montre', price: 250.4, rating: 4.1, category: 'furniture' }),
]

describe('parseCatalogQuery', () => {
  it('retourne les valeurs par défaut pour une URL sans paramètre', () => {
    expect(parseCatalogQuery({})).toEqual(DEFAULT_FILTERS)
  })

  it('lit tous les paramètres valides', () => {
    expect(
      parseCatalogQuery({
        page: '3',
        q: '  phone ',
        category: 'beauty',
        sortBy: 'price',
        order: 'desc',
        minPrice: '10',
        maxPrice: '99.5',
      }),
    ).toEqual({
      page: 3,
      q: 'phone',
      category: 'beauty',
      sortBy: 'price',
      order: 'desc',
      minPrice: 10,
      maxPrice: 99.5,
    })
  })

  it('ignore les valeurs invalides', () => {
    expect(
      parseCatalogQuery({
        page: 'abc',
        sortBy: 'stock',
        order: 'sideways',
        minPrice: '-5',
        maxPrice: 'cher',
        category: '',
      }),
    ).toEqual(DEFAULT_FILTERS)
  })

  it('refuse une page nulle, négative ou décimale', () => {
    expect(parseCatalogQuery({ page: '0' }).page).toBe(1)
    expect(parseCatalogQuery({ page: '-2' }).page).toBe(1)
    expect(parseCatalogQuery({ page: '1.5' }).page).toBe(1)
  })

  it('prend la première valeur d\'un paramètre répété', () => {
    expect(parseCatalogQuery({ q: ['un', 'deux'], page: ['2', '5'] })).toMatchObject({ q: 'un', page: 2 })
  })

  it('ignore les valeurs qui ne sont pas des chaînes', () => {
    expect(parseCatalogQuery({ q: 42, category: null })).toMatchObject({ q: '', category: 'all' })
  })

  it('inverse un prix min supérieur au prix max', () => {
    expect(parseCatalogQuery({ minPrice: '50', maxPrice: '10' })).toMatchObject({ minPrice: 10, maxPrice: 50 })
  })

  it('accepte un prix minimum à zéro', () => {
    expect(parseCatalogQuery({ minPrice: '0' }).minPrice).toBe(0)
  })
})

describe('toCatalogQuery', () => {
  it('n\'écrit rien pour les filtres par défaut', () => {
    expect(toCatalogQuery(DEFAULT_FILTERS)).toEqual({})
  })

  it('n\'écrit que les valeurs non défaut', () => {
    expect(
      toCatalogQuery({
        page: 2,
        q: ' lait ',
        category: 'groceries',
        sortBy: 'rating',
        order: 'desc',
        minPrice: 0,
        maxPrice: 40,
      }),
    ).toEqual({
      page: '2',
      q: 'lait',
      category: 'groceries',
      sortBy: 'rating',
      order: 'desc',
      minPrice: '0',
      maxPrice: '40',
    })
  })

  it('est l\'inverse de parseCatalogQuery', () => {
    const filters = parseCatalogQuery({ page: '4', q: 'x', category: 'beauty', sortBy: 'price', order: 'desc', minPrice: '1', maxPrice: '9' })
    expect(parseCatalogQuery(toCatalogQuery(filters))).toEqual(filters)
  })
})

describe('filterProducts', () => {
  it('conserve tout sans filtre', () => {
    expect(filterProducts(products, DEFAULT_FILTERS)).toHaveLength(4)
  })

  it('filtre par catégorie', () => {
    const result = filterProducts(products, { ...DEFAULT_FILTERS, category: 'furniture' })
    expect(result.map(product => product.id)).toEqual([2, 4])
  })

  it('filtre par prix min et max, bornes incluses', () => {
    const result = filterProducts(products, { ...DEFAULT_FILTERS, minPrice: 12.5, maxPrice: 99 })
    expect(result.map(product => product.id)).toEqual([1, 2])
  })

  it('accepte un prix minimum de zéro', () => {
    expect(filterProducts(products, { ...DEFAULT_FILTERS, minPrice: 0, maxPrice: 5 })).toHaveLength(1)
  })

  it('combine catégorie et prix', () => {
    expect(filterProducts(products, { category: 'furniture', minPrice: 100, maxPrice: null })).toHaveLength(1)
  })
})

describe('sortProducts', () => {
  it('trie par titre en tenant compte des accents', () => {
    expect(sortProducts(products, 'title', 'asc').map(product => product.title)).toEqual(['Abricot', 'Étui', 'Montre', 'Zèbre'])
  })

  it('trie par prix décroissant', () => {
    expect(sortProducts(products, 'price', 'desc').map(product => product.id)).toEqual([4, 2, 1, 3])
  })

  it('trie par note croissante', () => {
    expect(sortProducts(products, 'rating', 'asc')[0]?.id).toBe(1)
  })

  it('ne modifie pas le tableau d\'origine', () => {
    const copy = [...products]
    sortProducts(products, 'price', 'desc')
    expect(products).toEqual(copy)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 30 }, (_, index) => index + 1)

  it('découpe par pages de 12 par défaut', () => {
    const page = paginate(items, 1)
    expect(page.items).toHaveLength(12)
    expect(page).toMatchObject({ page: 1, totalPages: 3, total: 30, start: 1, end: 12 })
  })

  it('renvoie une dernière page partielle', () => {
    const page = paginate(items, 3)
    expect(page.items).toEqual([25, 26, 27, 28, 29, 30])
    expect(page).toMatchObject({ start: 25, end: 30 })
  })

  it('ramène une page trop grande à la dernière page', () => {
    expect(paginate(items, 99).page).toBe(3)
  })

  it('ramène une page inférieure à 1 à la première page', () => {
    expect(paginate(items, 0).page).toBe(1)
  })

  it('gère une liste vide', () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, totalPages: 1, total: 0, start: 0, end: 0 })
  })

  it('accepte une taille de page personnalisée', () => {
    expect(paginate(items, 2, 10).items[0]).toBe(11)
  })
})

describe('countByCategory', () => {
  it('compte les produits par catégorie', () => {
    expect(countByCategory(products)).toEqual({ beauty: 1, furniture: 2, groceries: 1 })
  })

  it('renvoie un objet vide sans produit', () => {
    expect(countByCategory([])).toEqual({})
  })
})

describe('getPriceCeiling', () => {
  it('arrondit le prix maximum à l\'entier supérieur', () => {
    expect(getPriceCeiling(products)).toBe(251)
  })

  it('utilise la valeur de repli sans produit', () => {
    expect(getPriceCeiling([])).toBe(1000)
    expect(getPriceCeiling([], 50)).toBe(50)
  })
})

describe('getPageWindow', () => {
  it('centre la fenêtre sur la page courante', () => {
    expect(getPageWindow(5, 10)).toEqual([4, 5, 6])
  })

  it('reste au début de la liste', () => {
    expect(getPageWindow(1, 10)).toEqual([1, 2, 3])
  })

  it('reste à la fin de la liste', () => {
    expect(getPageWindow(10, 10)).toEqual([8, 9, 10])
  })

  it('réduit la fenêtre quand il y a peu de pages', () => {
    expect(getPageWindow(1, 2)).toEqual([1, 2])
    expect(getPageWindow(1, 1)).toEqual([1])
  })
})
