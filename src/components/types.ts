import type {
  CaseV1,
  RankedProvisionsV1,
  ProvenanceEventV1,
} from 'legal-provision-types'
import type { ProviderMode, RetrievalProvider } from '../providers'

/** One retrieval method, as the server lists it. */
export interface MethodOption {
  id: string
  label: string
}

/** Ground truth for the evaluation badge (research mode). */
export interface GroundTruth {
  relevant_doc_ids: string[]
}

export interface ProvisionRetrieverProps {
  /** Optional heading above the controls. */
  title?: string
  /** The case to search for (case@1). */
  case?: CaseV1 | null
  /** Runs the search. The package never fetches. */
  onSearch?: (args: { query: string; method: string; case_id?: string }) => Promise<RankedProvisionsV1>
  /** Lists the retrieval methods the server offers. Called once on mount. */
  onListMethods?: () => Promise<MethodOption[]>
  /** Ground truth, when research mode is on behind a `groundTruth` flag. */
  groundTruth?: GroundTruth | null
  /** Optional provider mode override (single/multi). */
  providerMode?: ProviderMode
  /** Optional provider registry for multi-provider retrieval flows. */
  providers?: RetrievalProvider[]
  /** Preferred provider when `providers` are supplied. */
  defaultProvider?: string
  /** Whether to show the evaluation badge. Default false. */
  showEvaluation?: boolean
  /** Whether to emit provenance events. Default true. */
  emitProvenance?: boolean
  /** Whether to emit provenance events for failed retrieval calls. Default false. */
  emitErrorProvenance?: boolean
  defaultMethod?: string
  defaultThreshold?: number
}

/** Emitted with every search result. */
export type RetrievalResults = RankedProvisionsV1

/** Emitted for each provenance-worthy action. */
export type RetrievalProvenance = ProvenanceEventV1 & {
  provider_id?: string | null
}
