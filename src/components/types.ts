import type {
  CaseV1,
  RankedProvisionsV1,
  ProvenanceEventV1,
} from 'legal-provision-types'

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
  /** Whether to show the evaluation badge. Default false. */
  showEvaluation?: boolean
  defaultMethod?: string
  defaultThreshold?: number
}

/** Emitted with every search result. */
export type RetrievalResults = RankedProvisionsV1

/** Emitted for each provenance-worthy action. */
export type RetrievalProvenance = ProvenanceEventV1
