import { describe, expect, it } from 'vitest'
import { buildProductSeo, getProductImages, getStockState, truncateText } from '../../utils/product'

describe('getStockState', () => {
  it('signale la rupture de stock à 0', () => {
    expect(getStockState(0)).toEqual({ status: 'out', label: 'Rupture de stock' })
  })

  it('traite un stock négatif comme une rupture', () => {
    expect(getStockState(-2).status).toBe('out')
  })

  it.each([1, 4])('affiche « Plus que X en stock » pour %i', (stock) => {
    expect(getStockState(stock)).toEqual({ status: 'low', label: `Plus que ${stock} en stock` })
  })

  it.each([5, 42])('affiche « En stock » à partir de 5 (%i)', (stock) => {
    expect(getStockState(stock)).toEqual({ status: 'ok', label: 'En stock' })
  })
})

describe('truncateText', () => {
  it('laisse un texte court intact', () => {
    expect(truncateText('  Bonjour   le monde ', 50)).toBe('Bonjour le monde')
  })

  it('coupe sur un mot entier et ajoute une ellipse', () => {
    const result = truncateText('un deux trois quatre cinq', 15)
    expect(result).toBe('un deux trois…')
    expect(result.length).toBeLessThanOrEqual(15)
  })

  it('coupe brutalement un mot unique trop long', () => {
    expect(truncateText('abcdefghij', 5)).toBe('abcd…')
  })
})

describe('getProductImages', () => {
  it('retire les doublons', () => {
    expect(getProductImages({ images: ['a', 'b', 'a'], thumbnail: 'a' })).toEqual(['a', 'b'])
  })

  it('se replie sur la miniature quand il n’y a pas d’images', () => {
    expect(getProductImages({ images: [], thumbnail: 't' })).toEqual(['t'])
  })
})

describe('buildProductSeo', () => {
  const base = { title: 'Mascara', description: 'Un mascara volumateur.', images: ['i1'], thumbnail: 't1' }

  it('construit titre, description et image', () => {
    expect(buildProductSeo(base)).toEqual({
      title: 'Mascara | ChampaShop',
      description: 'Un mascara volumateur.',
      image: 't1',
    })
  })

  it('tronque une description trop longue à 160 caractères', () => {
    const seo = buildProductSeo({ ...base, description: 'mot '.repeat(100) })
    expect(seo.description.length).toBeLessThanOrEqual(160)
    expect(seo.description.endsWith('…')).toBe(true)
  })

  it('utilise la première image sans miniature', () => {
    expect(buildProductSeo({ ...base, thumbnail: '' }).image).toBe('i1')
  })

  it('renvoie une image vide sans aucune image', () => {
    expect(buildProductSeo({ ...base, thumbnail: '', images: [] }).image).toBe('')
  })
})
