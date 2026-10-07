import { describe, expect, it, vi } from 'vitest'
import { createHostProvider, resolveQueryBuilderConfig } from '../src/providers'

describe('provider config helpers', () => {
  it('provides backward-compatible defaults with provenance enabled', () => {
    const config = resolveQueryBuilderConfig()

    expect(config.providerMode).toBe('single')
    expect(config.defaultProvider).toBe('case-law')
    expect(config.features.emitProvenance).toBe(true)
    expect(config.providers).toHaveLength(1)
    expect(config.providers[0].type).toBe('case-law')
    expect(config.providers[0].capabilities?.supportsMethodListing).toBe(false)
    expect(config.providers[0].capabilities?.supportsThreshold).toBe(false)
  })

  it('applies case-law capability defaults unless explicitly overridden', () => {
    const withDefaults = resolveQueryBuilderConfig({
      providers: [
        {
          id: 'case-law',
          label: 'Case Law',
          type: 'case-law',
          transport: { searchEndpoint: '/api/case-law/search' },
        },
      ],
    })

    expect(withDefaults.providers[0].capabilities?.supportsMethodListing).toBe(false)
    expect(withDefaults.providers[0].capabilities?.supportsThreshold).toBe(false)

    const overridden = resolveQueryBuilderConfig({
      providers: [
        {
          id: 'case-law',
          label: 'Case Law',
          type: 'case-law',
          transport: { searchEndpoint: '/api/case-law/search' },
          capabilities: { supportsMethodListing: true },
        },
      ],
    })

    expect(overridden.providers[0].capabilities?.supportsMethodListing).toBe(true)
    expect(overridden.providers[0].capabilities?.supportsThreshold).toBe(false)
  })

  it('throws when defaultProvider is not present', () => {
    expect(() =>
      resolveQueryBuilderConfig({
        providers: [
          {
            id: 'provisions',
            label: 'Provisions',
            type: 'provision-retriever',
            transport: { searchEndpoint: '/api/provisions/search' },
          },
        ],
        defaultProvider: 'missing',
      }),
    ).toThrow('defaultProvider "missing" does not exist in providers[]')
  })

  it('keeps explicit feature overrides and supports host callback adapters', async () => {
    const search = vi.fn().mockResolvedValue({
      case_id: 'halden',
      query: 'query',
      method: 'bm25',
      threshold: 0.2,
      corpus_version: '1.0',
      documents: [],
    })

    const listMethods = vi.fn().mockResolvedValue([{ id: 'bm25', label: 'BM25' }])
    const provider = createHostProvider({
      id: 'provisions',
      label: 'Provisions',
      search,
      listMethods,
    })

    const methods = await provider.listMethods({ case_id: 'halden' })
    const results = await provider.search({ query: 'query', method: 'bm25', case_id: 'halden' })

    expect(methods).toEqual([{ id: 'bm25', label: 'BM25' }])
    expect(results.documents).toEqual([])

    const config = resolveQueryBuilderConfig({
      providerMode: 'multi',
      defaultProvider: 'provisions',
      features: { emitProvenance: false, showEvaluation: true },
      providers: [
        {
          id: 'provisions',
          label: 'Provisions',
          type: 'provision-retriever',
          transport: { searchEndpoint: '/api/provisions/search', methodsEndpoint: '/api/provisions/methods' },
        },
      ],
    })

    expect(config.providerMode).toBe('multi')
    expect(config.features.emitProvenance).toBe(false)
    expect(config.features.showEvaluation).toBe(true)
  })
})
