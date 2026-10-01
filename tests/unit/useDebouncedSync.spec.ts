import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { SEARCH_DEBOUNCE_MS, useDebouncedSync } from '../../app/composables/useDebouncedSync'

describe('useDebouncedSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const setup = (initial = '') => {
    const source = ref(initial)
    const commit = vi.fn()
    const scope = effectScope()
    const input = scope.run(() => useDebouncedSync(source, commit))!
    return { source, commit, input, scope }
  }

  it('reprend la valeur initiale de la source', () => {
    expect(setup('phone').input.value).toBe('phone')
  })

  it('ne propage la saisie qu\'après 300 ms sans frappe', async () => {
    const { input, commit } = setup()

    input.value = 'ip'
    await nextTick()
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1)
    expect(commit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(commit).toHaveBeenCalledExactlyOnceWith('ip')
  })

  it('ne propage que la dernière valeur en cas de frappe rapide', async () => {
    const { input, commit } = setup()

    for (const value of ['i', 'ip', 'iph', 'ipho']) {
      input.value = value
      await nextTick()
      vi.advanceTimersByTime(100)
    }
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)

    expect(commit).toHaveBeenCalledExactlyOnceWith('ipho')
  })

  it('supprime les espaces autour de la saisie', async () => {
    const { input, commit } = setup()

    input.value = '  lait '
    await nextTick()
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)

    expect(commit).toHaveBeenCalledWith('lait')
  })

  it('ne propage rien quand la saisie égale la source', async () => {
    const { input, commit } = setup('lait')

    input.value = 'lait '
    await nextTick()
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)

    expect(commit).not.toHaveBeenCalled()
  })

  it('met le champ à jour quand la source change (retour arrière)', async () => {
    const { input, source, commit } = setup('a')

    source.value = 'b'
    await nextTick()
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)

    expect(input.value).toBe('b')
    expect(commit).not.toHaveBeenCalled()
  })

  it('annule la saisie en attente à la destruction du scope', async () => {
    const { input, commit, scope } = setup()

    input.value = 'x'
    await nextTick()
    scope.stop()
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)

    expect(commit).not.toHaveBeenCalled()
  })
})
