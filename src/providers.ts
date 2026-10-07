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

export interface QueryBuilderManifestV1 {
  schemaVersion: '1'
  providerMode: ProviderMode
  defaultProvider: string
  providers: RetrievalProviderConfig[]
  features?: {
    showEvaluation?: boolean
    emitProvenance?: boolean
  }
}

export type QueryBuilderManifest = QueryBuilderManifestV1

export interface ValidationIssue {
  path: string
  message: string
}

export class QueryBuilderManifestValidationError extends Error {
  readonly code = 'INVALID_MANIFEST'
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    super(`Invalid query-builder manifest (${issues.length} issue${issues.length === 1 ? '' : 's'})`)
    this.name = 'QueryBuilderManifestValidationError'
    this.issues = issues
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProviderMode(value: unknown): value is ProviderMode {
  return value === 'single' || value === 'multi'
}

function asOptionalBoolean(value: unknown, path: string, issues: ValidationIssue[]): boolean | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'boolean') return value
  issues.push({ path, message: 'expected boolean' })
  return undefined
}

function validateProviderConfig(value: unknown, path: string, issues: ValidationIssue[]): RetrievalProviderConfig | null {
  if (!isRecord(value)) {
    issues.push({ path, message: 'expected object' })
    return null
  }

  const { id, label, type, transport } = value
  if (typeof id !== 'string' || id.trim().length === 0) {
    issues.push({ path: `${path}.id`, message: 'expected non-empty string' })
  }
  if (typeof label !== 'string' || label.trim().length === 0) {
    issues.push({ path: `${path}.label`, message: 'expected non-empty string' })
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    issues.push({ path: `${path}.type`, message: 'expected non-empty string' })
  }
  if (!isRecord(transport)) {
    issues.push({ path: `${path}.transport`, message: 'expected object' })
    return null
  }

  const searchEndpoint = transport.searchEndpoint
  const methodsEndpoint = transport.methodsEndpoint
  const searchMethod = transport.searchMethod
  const methodsMethod = transport.methodsMethod

  if (typeof searchEndpoint !== 'string' || searchEndpoint.trim().length === 0) {
    issues.push({ path: `${path}.transport.searchEndpoint`, message: 'expected non-empty string' })
  }
  if (methodsEndpoint !== undefined && (typeof methodsEndpoint !== 'string' || methodsEndpoint.trim().length === 0)) {
    issues.push({ path: `${path}.transport.methodsEndpoint`, message: 'expected non-empty string' })
  }
  if (searchMethod !== undefined && searchMethod !== 'GET' && searchMethod !== 'POST') {
    issues.push({ path: `${path}.transport.searchMethod`, message: 'expected "GET" | "POST"' })
  }
  if (methodsMethod !== undefined && methodsMethod !== 'GET' && methodsMethod !== 'POST') {
    issues.push({ path: `${path}.transport.methodsMethod`, message: 'expected "GET" | "POST"' })
  }

  const defaults = isRecord(value.defaults)
    ? {
        method: typeof value.defaults.method === 'string' ? value.defaults.method : undefined,
        threshold: typeof value.defaults.threshold === 'number' ? value.defaults.threshold : undefined,
      }
    : undefined

  if (value.defaults !== undefined && !isRecord(value.defaults)) {
    issues.push({ path: `${path}.defaults`, message: 'expected object' })
  }
  if (isRecord(value.defaults) && value.defaults.threshold !== undefined && typeof value.defaults.threshold !== 'number') {
    issues.push({ path: `${path}.defaults.threshold`, message: 'expected number' })
  }

  const capabilities = isRecord(value.capabilities)
    ? {
        supportsMethodListing: asOptionalBoolean(
          value.capabilities.supportsMethodListing,
          `${path}.capabilities.supportsMethodListing`,
          issues,
        ),
        supportsThreshold: asOptionalBoolean(
          value.capabilities.supportsThreshold,
          `${path}.capabilities.supportsThreshold`,
          issues,
        ),
        supportsEvaluation: asOptionalBoolean(
          value.capabilities.supportsEvaluation,
          `${path}.capabilities.supportsEvaluation`,
          issues,
        ),
      }
    : undefined

  if (value.capabilities !== undefined && !isRecord(value.capabilities)) {
    issues.push({ path: `${path}.capabilities`, message: 'expected object' })
  }

  if (issues.some((issue) => issue.path.startsWith(path))) {
    // Keep collecting across providers; return best-effort object for callers that need one.
  }

  return {
    id: typeof id === 'string' ? id : '',
    label: typeof label === 'string' ? label : '',
    type: typeof type === 'string' ? type : '',
    transport: {
      searchEndpoint: typeof searchEndpoint === 'string' ? searchEndpoint : '',
      methodsEndpoint: typeof methodsEndpoint === 'string' ? methodsEndpoint : undefined,
      searchMethod: searchMethod === 'GET' || searchMethod === 'POST' ? searchMethod : undefined,
      methodsMethod: methodsMethod === 'GET' || methodsMethod === 'POST' ? methodsMethod : undefined,
    },
    defaults,
    capabilities,
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
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

export function validateQueryBuilderManifest(manifest: unknown): QueryBuilderManifest {
  const issues: ValidationIssue[] = []
  if (!isRecord(manifest)) {
    throw new QueryBuilderManifestValidationError([{ path: 'manifest', message: 'expected object' }])
  }

  if (manifest.schemaVersion !== '1') {
    issues.push({ path: 'schemaVersion', message: 'expected "1"' })
  }

  if (!isProviderMode(manifest.providerMode)) {
    issues.push({ path: 'providerMode', message: 'expected "single" | "multi"' })
  }

  if (typeof manifest.defaultProvider !== 'string' || manifest.defaultProvider.trim().length === 0) {
    issues.push({ path: 'defaultProvider', message: 'expected non-empty string' })
  }

  if (!Array.isArray(manifest.providers) || manifest.providers.length === 0) {
    issues.push({ path: 'providers', message: 'expected non-empty array' })
  }

  const providers = Array.isArray(manifest.providers)
    ? manifest.providers.map((provider, index) => validateProviderConfig(provider, `providers[${index}]`, issues))
    : []

  if (manifest.features !== undefined && !isRecord(manifest.features)) {
    issues.push({ path: 'features', message: 'expected object' })
  }

  const features = isRecord(manifest.features)
    ? {
        showEvaluation: asOptionalBoolean(manifest.features.showEvaluation, 'features.showEvaluation', issues),
        emitProvenance: asOptionalBoolean(manifest.features.emitProvenance, 'features.emitProvenance', issues),
      }
    : undefined

  if (issues.length > 0) {
    throw new QueryBuilderManifestValidationError(issues)
  }

  return {
    schemaVersion: '1',
    providerMode: manifest.providerMode as ProviderMode,
    defaultProvider: manifest.defaultProvider as string,
    providers: providers.filter((provider): provider is RetrievalProviderConfig => provider !== null),
    features,
  }
}

export function resolveQueryBuilderConfigFromManifest(manifest: unknown): ResolvedQueryBuilderConfig {
  const validated = validateQueryBuilderManifest(manifest)
  return resolveQueryBuilderConfig(validated)
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
