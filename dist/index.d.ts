import type { DefineComponent, Plugin } from "vue";
import type { CaseV1, RankedProvisionsV1, ProvenanceEventV1 } from "legal-provision-types";

export type {
  ProvisionRetrieverProps,
  MethodOption,
  GroundTruth,
  RetrievalResults,
  RetrievalProvenance,
} from "./components/types";

export declare const DEFAULT_THRESHOLD: number;
export declare const DEFAULT_METHOD: string;

export declare function normaliseThreshold(value: number): number;
export declare function formatThreshold(value: number): string;
export declare function scoreColor(score: number): string;
export declare function scoreWidth(score: number): number;
export declare function formatScore(score: number): string;
export declare function isBelowThreshold(score: number, threshold: number): boolean;
export declare function evaluateSelection(
  selectedDocIds: string[],
  groundTruth: { relevant_doc_ids: string[] } | null | undefined,
): { precision: number; recall: number; f1: number; count: number; hasGroundTruth: boolean };
export declare function formatEvalBadge(metrics: {
  precision: number;
  recall: number;
  f1: number;
  count: number;
}): string;

export declare const ProvisionRetriever: DefineComponent<
  import("./components/types").ProvisionRetrieverProps,
  {},
  any
>;

export type { CaseV1, RankedProvisionsV1, ProvenanceEventV1 };

export declare const VueLegalProvisionRetrieverPlugin: Plugin;

export default VueLegalProvisionRetrieverPlugin;
