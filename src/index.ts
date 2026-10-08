import type { App, Plugin } from 'vue'

import ProvisionRetriever from './components/ProvisionRetriever.vue'
export { ProvisionRetriever }

export type {
  ProvisionRetrieverProps,
  MethodOption,
  GroundTruth,
  RetrievalResults,
  RetrievalProvenance,
} from './components/types'

export type {
  ProviderMode,
  RetrievalProviderCapabilities,
  RetrievalTransportConfig,
  RetrievalProviderConfig,
  QueryBuilderConfig,
  QueryBuilderManifestV1,
  QueryBuilderManifest,
  ValidationIssue,
  ResolvedQueryBuilderConfig,
  ProviderContext,
  ProviderSearchContext,
  RetrievalProvider,
  HostProviderOptions,
  TransportRequest,
  TransportExecutor,
  CreateTransportProviderOptions,
  CreateProvidersFromConfigOptions,
  CreateProvidersFromManifestOptions,
  QueryBuilderManifestValidationError,
} from './providers'

export {
  resolveQueryBuilderConfig,
  createHostProvider,
  createTransportProvider,
  createProvidersFromConfig,
  createProvidersFromManifest,
  validateQueryBuilderManifest,
  resolveQueryBuilderConfigFromManifest,
} from './providers'

// Pure helpers, exported so a host can reuse them without the component.
export {
  DEFAULT_METHOD,
  DEFAULT_THRESHOLD,
  evaluateSelection,
  formatEvalBadge,
  formatScore,
  formatThreshold,
  isBelowThreshold,
  normaliseThreshold,
  scoreColor,
  scoreWidth,
} from './components/retrieval'

// The port contract this package reads and emits, re-exported for convenience.
export type { CaseV1, RankedProvisionsV1, ProvenanceEventV1 } from 'legal-provision-types'

export const VueLegalProvisionRetrieverPlugin: Plugin = {
  install(app: App) {
    app.component('ProvisionRetriever', ProvisionRetriever)
  },
}

export default VueLegalProvisionRetrieverPlugin
