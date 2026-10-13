// Runtime provider adapters for the retriever, plus a re-export of the shared
// config/manifest contracts now owned by legal-retrieval-types.
//
// The config types (QueryBuilderConfig, the manifest, the validators) moved to
// legal-retrieval-types so the query builder and legal-blocks read one shape.
// They are re-exported here so existing imports keep working.

import type { RankedProvisionsV1 } from 'legal-provision-types'
import type { MethodOption } from './components/types'
import type {
  ProviderMode,
  RetrievalProviderCapabilities,
  RetrievalProviderConfig,
  ResolvedQueryBuilderConfig,
} from 'legal-retrieval-types'
import {
  resolveQueryBuilderConfig,
  resolveQueryBuilderConfigFromManifest,
  withProviderTypeDefaults,
} from 'legal-retrieval-types'

export type {
  ProviderMode,
  RetrievalProviderCapabilities,
  RetrievalTransportConfig,
  RetrievalProviderConfig,
  QueryBuilderConfig,
  QueryBuilderManifestV1,
  QueryBuilderManifestV2,
  QueryBuilderManifest,
  ValidationIssue,
  ResolvedQueryBuilderConfig,
} from 'legal-retrieval-types'

export {
  QueryBuilderManifestValidationError,
  withProviderTypeDefaults,
  resolveQueryBuilderConfig,
  validateQueryBuilderManifest,
  resolveQueryBuilderConfigFromManifest,
} from 'legal-retrieval-types'

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
  config: import('legal-retrieval-types').QueryBuilderConfig | ResolvedQueryBuilderConfig
  execute: TransportExecutor
}

export interface CreateProvidersFromManifestOptions {
  manifest: unknown
  execute: TransportExecutor
}

export interface ProvisionRetrieverRuntimeOptions {
  providerMode: ProviderMode
  defaultProvider: string
  providers: RetrievalProvider[]
  showEvaluation: boolean
  emitProvenance: boolean
  defaultMethod?: string
  defaultThreshold?: number
}

export interface CreateProvisionRetrieverOptionsFromConfigOptions {
  config: import('legal-retrieval-types').QueryBuilderConfig | ResolvedQueryBuilderConfig
  execute: TransportExecutor
}

export interface CreateProvisionRetrieverOptionsFromManifestOptions {
  manifest: unknown
  execute: TransportExecutor
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

export function createProvidersFromManifest(options: CreateProvidersFromManifestOptions): RetrievalProvider[] {
  const resolved = resolveQueryBuilderConfigFromManifest(options.manifest)
  return createProvidersFromConfig({ config: resolved, execute: options.execute })
}

export function createProvisionRetrieverOptionsFromConfig(
  options: CreateProvisionRetrieverOptionsFromConfigOptions,
): ProvisionRetrieverRuntimeOptions {
  const resolved = resolveQueryBuilderConfig(options.config)
  const providers = createProvidersFromConfig({ config: resolved, execute: options.execute })
  const selected = resolved.providers.find((provider) => provider.id === resolved.defaultProvider)

  return {
    providerMode: resolved.providerMode,
    defaultProvider: resolved.defaultProvider,
    providers,
    showEvaluation: resolved.features.showEvaluation,
    emitProvenance: resolved.features.emitProvenance,
    defaultMethod: selected?.defaults?.method,
    defaultThreshold: selected?.defaults?.threshold,
  }
}

export function createProvisionRetrieverOptionsFromManifest(
  options: CreateProvisionRetrieverOptionsFromManifestOptions,
): ProvisionRetrieverRuntimeOptions {
  const resolved = resolveQueryBuilderConfigFromManifest(options.manifest)
  return createProvisionRetrieverOptionsFromConfig({ config: resolved, execute: options.execute })
}
