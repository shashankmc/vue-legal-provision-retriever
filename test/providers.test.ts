import { describe, expect, it, vi } from 'vitest'
import {
  createHostProvider,
  createProvisionRetrieverOptionsFromConfig,
  createProvisionRetrieverOptionsFromManifest,
  createProvidersFromConfig,
  createProvidersFromManifest,
  createTransportProvider,
  QueryBuilderManifestValidationError,
  resolveQueryBuilderConfigFromManifest,
  resolveQueryBuilderConfig,
  validateQueryBuilderManifest,
} from '../src/providers'

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

  it('creates transport providers from config and uses endpoint methods', async () => {
    const execute = vi.fn(async (request: { endpoint: string; method: 'GET' | 'POST'; body?: unknown; query?: unknown }) => {
      if (request.endpoint === '/api/provisions/methods') {
        return [{ id: 'sbert', label: 'SBERT' }]
      }
      if (request.endpoint === '/api/provisions/search') {
        return {
          case_id: 'halden',
          query: 'query',
          method: 'sbert',
          threshold: 0.2,
          corpus_version: '1.0',
          documents: [],
        }
      }
      throw new Error('unexpected endpoint')
    })

    const provider = createTransportProvider({
      config: {
        id: 'provisions',
        label: 'Provisions',
        type: 'provision-retriever',
        transport: {
          methodsEndpoint: '/api/provisions/methods',
          methodsMethod: 'GET',
          searchEndpoint: '/api/provisions/search',
          searchMethod: 'POST',
        },
      },
      execute,
    })

    const methods = await provider.listMethods({ case_id: 'halden' })
    await provider.search({ query: 'query', method: 'sbert', case_id: 'halden' })

    expect(methods).toEqual([{ id: 'sbert', label: 'SBERT' }])
    expect(execute).toHaveBeenNthCalledWith(1, {
      endpoint: '/api/provisions/methods',
      method: 'GET',
      query: { case_id: 'halden' },
    })
    expect(execute).toHaveBeenNthCalledWith(2, {
      endpoint: '/api/provisions/search',
      method: 'POST',
      body: { query: 'query', method: 'sbert', case_id: 'halden' },
    })
  })

  it('applies case-law defaults for transport providers and can build all providers from config', async () => {
    const execute = vi.fn(async (request: { endpoint: string; method: 'GET' | 'POST' }) => {
      if (request.endpoint === '/api/provisions/methods') {
        return [{ id: 'hybrid', label: 'Hybrid' }]
      }
      if (request.endpoint === '/api/provisions/search' || request.endpoint === '/api/case-law/search') {
        return {
          case_id: 'halden',
          query: 'q',
          method: 'hybrid',
          threshold: 0.2,
          corpus_version: '1.0',
          documents: [],
        }
      }
      return []
    })

    const providers = createProvidersFromConfig({
      execute,
      config: {
        providerMode: 'multi',
        defaultProvider: 'case-law',
        providers: [
          {
            id: 'case-law',
            label: 'Case Law',
            type: 'case-law',
            transport: { searchEndpoint: '/api/case-law/search' },
          },
          {
            id: 'provisions',
            label: 'Provisions',
            type: 'provision-retriever',
            transport: {
              methodsEndpoint: '/api/provisions/methods',
              searchEndpoint: '/api/provisions/search',
            },
          },
        ],
      },
    })

    const caseLaw = providers.find((provider) => provider.id === 'case-law')!
    const provisions = providers.find((provider) => provider.id === 'provisions')!

    expect(caseLaw.capabilities?.supportsMethodListing).toBe(false)
    expect(caseLaw.capabilities?.supportsThreshold).toBe(false)
    expect(await caseLaw.listMethods({ case_id: 'halden' })).toEqual([])

    expect(await provisions.listMethods({ case_id: 'halden' })).toEqual([{ id: 'hybrid', label: 'Hybrid' }])
    await caseLaw.search({ query: 'q', method: 'api', case_id: 'halden' })

    expect(execute).toHaveBeenCalledWith({
      endpoint: '/api/case-law/search',
      method: 'POST',
      body: { query: 'q', method: 'api', case_id: 'halden' },
    })
  })

  it('validates manifest shape and resolves config from manifest', () => {
    const manifest = validateQueryBuilderManifest({
      schemaVersion: '1',
      providerMode: 'single',
      defaultProvider: 'case-law',
      providers: [
        {
          id: 'case-law',
          label: 'Case Law',
          type: 'case-law',
          transport: { searchEndpoint: '/api/case-law/search' },
        },
      ],
      features: {
        emitProvenance: true,
      },
    })

    expect(manifest.schemaVersion).toBe('1')
    const resolved = resolveQueryBuilderConfigFromManifest(manifest)
    expect(resolved.defaultProvider).toBe('case-law')
    expect(resolved.features.emitProvenance).toBe(true)
    expect(resolved.providers[0].capabilities?.supportsThreshold).toBe(false)
  })

  it('throws structured manifest validation errors', () => {
    try {
      validateQueryBuilderManifest({
        schemaVersion: '2',
        providerMode: 'many',
        defaultProvider: '',
        providers: [],
      })
      throw new Error('expected validation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(QueryBuilderManifestValidationError)
      const validationError = error as QueryBuilderManifestValidationError
      expect(validationError.code).toBe('INVALID_MANIFEST')
      expect(validationError.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining(['schemaVersion', 'providerMode', 'defaultProvider', 'providers']),
      )
    }
  })

  it('creates providers directly from a resolved legal-blocks manifest', async () => {
    const execute = vi.fn(async (request: { endpoint: string; method: 'GET' | 'POST' }) => {
      if (request.endpoint === '/api/provisions/methods') {
        return [{ id: 'hybrid', label: 'Hybrid' }]
      }
      if (request.endpoint === '/api/provisions/search') {
        return {
          case_id: 'halden',
          query: 'q',
          method: 'hybrid',
          threshold: 0.2,
          corpus_version: '1.0',
          documents: [],
        }
      }
      throw new Error('unexpected endpoint')
    })

    const providers = createProvidersFromManifest({
      execute,
      manifest: {
        schemaVersion: '1',
        providerMode: 'single',
        defaultProvider: 'provisions',
        providers: [
          {
            id: 'provisions',
            label: 'Provisions',
            type: 'provision-retriever',
            transport: {
              methodsEndpoint: '/api/provisions/methods',
              searchEndpoint: '/api/provisions/search',
            },
          },
        ],
      },
    })

    expect(providers).toHaveLength(1)
    expect(providers[0].id).toBe('provisions')
    expect(await providers[0].listMethods({ case_id: 'halden' })).toEqual([{ id: 'hybrid', label: 'Hybrid' }])
  })

  it('fails fast when creating providers from an invalid manifest', () => {
    expect(() =>
      createProvidersFromManifest({
        execute: vi.fn(),
        manifest: {
          schemaVersion: '2',
          providerMode: 'single',
          defaultProvider: 'x',
          providers: [],
        },
      }),
    ).toThrow(QueryBuilderManifestValidationError)
  })

  it('builds ProvisionRetriever runtime options from config', () => {
    const runtime = createProvisionRetrieverOptionsFromConfig({
      execute: vi.fn(),
      config: {
        providerMode: 'single',
        defaultProvider: 'provisions',
        features: {
          emitProvenance: true,
          showEvaluation: true,
        },
        providers: [
          {
            id: 'provisions',
            label: 'Provisions',
            type: 'provision-retriever',
            defaults: { method: 'sbert', threshold: 0.35 },
            transport: { searchEndpoint: '/api/provisions/search' },
          },
        ],
      },
    })

    expect(runtime.providerMode).toBe('single')
    expect(runtime.defaultProvider).toBe('provisions')
    expect(runtime.showEvaluation).toBe(true)
    expect(runtime.emitProvenance).toBe(true)
    expect(runtime.defaultMethod).toBe('sbert')
    expect(runtime.defaultThreshold).toBe(0.35)
    expect(runtime.providers).toHaveLength(1)
  })

  it('builds ProvisionRetriever runtime options from manifest', () => {
    const runtime = createProvisionRetrieverOptionsFromManifest({
      execute: vi.fn(),
      manifest: {
        schemaVersion: '1',
        providerMode: 'single',
        defaultProvider: 'case-law',
        providers: [
          {
            id: 'case-law',
            label: 'Case Law',
            type: 'case-law',
            transport: { searchEndpoint: '/api/case-law/search' },
          },
        ],
      },
    })

    expect(runtime.defaultProvider).toBe('case-law')
    expect(runtime.providers[0].capabilities?.supportsMethodListing).toBe(false)
    expect(runtime.providers[0].capabilities?.supportsThreshold).toBe(false)
    expect(runtime.emitProvenance).toBe(true)
  })
})
