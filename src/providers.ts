import type { RankedProvisionsV1 } from 'legal-provision-types'
import type { MethodOption } from './components/types'

export type ProviderMode = 'single' | 'multi'

export interface RetrievalProviderCapabilities {
  supportsMethodListing?: boolean
  supportsThreshold?: boolean
  supportsEvaluation?: boolean
}

export interface RetrievalTransportConfig {
  searchEndpoint: string
  searchMethod?: 'GET' | 'POST'
  methodsEndpoint?: string
  methodsMethod?: 'GET' | 'POST'
}

export interface RetrievalProviderConfig {
  id: string
  label: string
  type: string
  transport: RetrievalTransportConfig
  defaults?: {
    method?: string
    threshold?: number
  }
  capabilities?: RetrievalProviderCapabilities
  metadata?: Record<string, unknown>
}

export interface QueryBuilderConfig {
  providerMode?: ProviderMode
  defaultProvider?: string
  providers?: RetrievalProviderConfig[]
  features?: {
    showEvaluation?: boolean
    emitProvenance?: boolean
  }
}

export interface ResolvedQueryBuilderConfig {
  providerMode: ProviderMode
  defaultProvider: string
  providers: RetrievalProviderConfig[]
  features: {
    showEvaluation: boolean
    emitProvenance: boolean
  }
}

export interface ProviderContext {
  case_id?: string
}

export interface ProviderSearchContext extends ProviderContext {
  query: string
  method: string
}

export interface RetrievalProvider {
  id: string
  label: string
  listMethods: (ctx: ProviderContext) => Promise<MethodOption[]>
  search: (ctx: ProviderSearchContext) => Promise<RankedProvisionsV1>
  capabilities?: RetrievalProviderCapabilities
}

export interface HostProviderOptions {
  id: string
  label: string
  search: RetrievalProvider['search']
  listMethods?: RetrievalProvider['listMethods']
  capabilities?: RetrievalProviderCapabilities
}

export interface TransportRequest {
  endpoint: string
  method: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

export type TransportExecutor = <TResponse>(request: TransportRequest) => Promise<TResponse>

export interface CreateTransportProviderOptions {
  config: RetrievalProviderConfig
  execute: TransportExecutor
}

export interface CreateProvidersFromConfigOptions {
  config: QueryBuilderConfig | ResolvedQueryBuilderConfig
  execute: TransportExecutor
}

const DEFAULT_CASE_LAW_PROVIDER: RetrievalProviderConfig = {
  id: 'case-law',
  label: 'Case Law',
  type: 'case-law',
  transport: {
    searchEndpoint: '/api/case-law/search',
    methodsEndpoint: '/api/case-law/methods',
  },
  defaults: {
    method: 'bm25',
    threshold: 0.2,
  },
}

function withProviderTypeDefaults(provider: RetrievalProviderConfig): RetrievalProviderConfig {
  if (provider.type !== 'case-law') return provider

  return {
    ...provider,
    capabilities: {
      supportsMethodListing: false,
      supportsThreshold: false,
      ...provider.capabilities,
    },
  }
}

export function resolveQueryBuilderConfig(input: QueryBuilderConfig = {}): ResolvedQueryBuilderConfig {
  const providers = (input.providers?.length ? input.providers : [DEFAULT_CASE_LAW_PROVIDER]).map(withProviderTypeDefaults)
  const defaultProvider = input.defaultProvider ?? providers[0].id

  if (!providers.some((provider) => provider.id === defaultProvider)) {
    throw new Error(`defaultProvider \"${defaultProvider}\" does not exist in providers[]`)
  }

  return {
    providerMode: input.providerMode ?? 'single',
    defaultProvider,
    providers,
    features: {
      showEvaluation: input.features?.showEvaluation ?? false,
      emitProvenance: input.features?.emitProvenance ?? true,
    },
  }
}

export function createHostProvider(options: HostProviderOptions): RetrievalProvider {
  return {
    id: options.id,
    label: options.label,
    capabilities: options.capabilities,
    search: options.search,
    listMethods: options.listMethods ?? (() => Promise.resolve([])),
  }
}

export function createTransportProvider(options: CreateTransportProviderOptions): RetrievalProvider {
  const config = withProviderTypeDefaults(options.config)

  return {
    id: config.id,
    label: config.label,
    capabilities: config.capabilities,
    listMethods: async (ctx) => {
      if (config.capabilities?.supportsMethodListing === false || !config.transport.methodsEndpoint) {
        return []
      }

      const methodsMethod = config.transport.methodsMethod ?? 'GET'
      if (methodsMethod === 'GET') {
        return options.execute<MethodOption[]>({
          endpoint: config.transport.methodsEndpoint,
          method: 'GET',
          query: { case_id: ctx.case_id },
        })
      }

      return options.execute<MethodOption[]>({
        endpoint: config.transport.methodsEndpoint,
        method: 'POST',
        body: { case_id: ctx.case_id },
      })
    },
    search: async (ctx) => {
      const searchMethod = config.transport.searchMethod ?? 'POST'
      if (searchMethod === 'GET') {
        return options.execute<RankedProvisionsV1>({
          endpoint: config.transport.searchEndpoint,
          method: 'GET',
          query: {
            query: ctx.query,
            method: ctx.method,
            case_id: ctx.case_id,
          },
        })
      }

      return options.execute<RankedProvisionsV1>({
        endpoint: config.transport.searchEndpoint,
        method: 'POST',
        body: {
          query: ctx.query,
          method: ctx.method,
          case_id: ctx.case_id,
        },
      })
    },
  }
}

export function createProvidersFromConfig(options: CreateProvidersFromConfigOptions): RetrievalProvider[] {
  const resolved = resolveQueryBuilderConfig(options.config)
  return resolved.providers.map((provider) => createTransportProvider({ config: provider, execute: options.execute }))
}
