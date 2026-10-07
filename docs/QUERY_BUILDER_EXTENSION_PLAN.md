# Detailed Plan: Extend `vue-legal-query-builder` with Configurable Retrieval Providers

## 1. Goal

Evolve `vue-legal-query-builder` from a case-law-only retriever into an extensible retrieval host that can:

1. Support multiple retrieval providers (including provision retrieval from this package).
2. Let integrators configure whether users can switch providers at runtime.
3. Accept configuration resolved by `legal-blocks` (code + JSON/manifest driven).
4. Preserve backward compatibility for existing case-law consumers.

This document is implementation planning only; no runtime behavior changes are introduced yet.

## 2. Scope

### In scope

- Introduce a provider abstraction in `vue-legal-query-builder`.
- Add runtime modes: single-provider and multi-provider.
- Define a typed configuration contract for query-builder.
- Define a manifest/JSON schema that `legal-blocks` can resolve and pass in.
- Keep `emitProvenance` defaulted to `true`.
- Add migration path from legacy case-law behavior.

### Out of scope

- Server/backend changes for retrieval algorithms.
- Auth token strategy design in client packages.
- UI redesign beyond provider/method controls and compatibility updates.

## 3. Architectural Target

### 3.1 Core principle

`vue-legal-query-builder` must call retrieval through provider adapters only. No direct hardcoded case-law retrieval path in feature code.

### 3.2 Contract layers

1. **Query-builder public config**: one object accepted at install/component init.
2. **Provider adapter interface**: uniform runtime API to list methods and run search.
3. **Canonical result model**: normalized retrieval payload consumed by UI and emitted as events.
4. **Provenance event model**: standardized event emitted across all providers.

### 3.3 Integration contract with `legal-blocks`

- `legal-blocks` loads and resolves manifest JSON.
- `legal-blocks` applies environment/tenant overrides.
- `legal-blocks` passes the final resolved config object into `vue-legal-query-builder`.
- `vue-legal-query-builder` does not fetch manifests itself.

## 4. Data and Type Contracts

## 4.1 Query-builder config (proposed)

```ts
export interface QueryBuilderConfig {
  providerMode: 'single' | 'multi'
  defaultProvider: string
  providers: RetrievalProviderConfig[]
  features?: {
    showEvaluation?: boolean
    emitProvenance?: boolean // default true
  }
}

export interface RetrievalProviderConfig {
  id: string
  label: string
  type: 'case-law' | 'provision-retriever' | string
  capabilities?: {
    supportsMethodListing?: boolean
    supportsThreshold?: boolean
    supportsEvaluation?: boolean
  }
  transport: {
    methodsEndpoint?: string
    searchEndpoint: string
  }
  defaults?: {
    method?: string
    threshold?: number
  }
  metadata?: Record<string, unknown>
}
```

## 4.2 Provider adapter interface (proposed)

```ts
export interface RetrievalProvider {
  id: string
  label: string
  listMethods: (ctx: ProviderContext) => Promise<MethodOption[]>
  search: (ctx: ProviderSearchContext) => Promise<RankedProvisionsV1>
  capabilities?: RetrievalProviderConfig['capabilities']
}
```

## 4.3 Canonical payloads

- Use `RankedProvisionsV1` as canonical retrieval output for UI consumption.
- Use provenance event shape aligned with `ProvenanceEventV1`.
- Keep `emitProvenance` default `true`; if set `false`, suppress emission but keep internal trace hooks available for diagnostics.

## 5. Manifest/JSON Schema (for legal-blocks)

### 5.1 Schema requirements

- `schemaVersion` (required) for evolution safety.
- `providerMode` (required).
- `defaultProvider` (required).
- `providers` (required, non-empty).
- `features.emitProvenance` optional, default `true`.

### 5.2 Example manifest

```json
{
  "schemaVersion": "1",
  "providerMode": "multi",
  "defaultProvider": "case-law",
  "features": {
    "showEvaluation": false,
    "emitProvenance": true
  },
  "providers": [
    {
      "id": "case-law",
      "label": "Case Law",
      "type": "case-law",
      "transport": {
        "methodsEndpoint": "/api/case-law/methods",
        "searchEndpoint": "/api/case-law/search"
      },
      "defaults": {
        "method": "bm25",
        "threshold": 0.2
      }
    },
    {
      "id": "provisions",
      "label": "Provisions",
      "type": "provision-retriever",
      "transport": {
        "methodsEndpoint": "/api/provisions/methods",
        "searchEndpoint": "/api/provisions/search"
      },
      "defaults": {
        "method": "bm25",
        "threshold": 0.2
      }
    }
  ]
}
```

### 5.3 Validation strategy

- Validate with `zod` or `ajv` at config ingestion boundary.
- Throw structured errors with code + message + offending path.
- Reject misconfigurations early (before mounting interactive UI).

## 6. Implementation Phases

### Phase 0: Baseline and compatibility locks

1. Capture existing behavior snapshots (tests + docs references).
2. Define compatibility guarantees:
   - zero-config remains case-law behavior,
   - current events still emitted,
   - existing public API continues to function.

### Phase 1: Introduce config and provider abstractions

1. Add config interfaces and defaults.
2. Add provider registry and adapter resolution.
3. Add legacy `case-law` adapter that wraps current retrieval path.
4. Route existing retrieval calls through adapter internally.

Acceptance criteria:

- No behavior change in legacy mode.
- Internal retrieval path no longer hardcoded outside adapter.

### Phase 2: Add provider mode behavior

1. Implement `providerMode: 'single' | 'multi'` runtime behavior.
2. In single mode:
   - lock provider to `defaultProvider`,
   - hide provider switch controls.
3. In multi mode:
   - render provider selector,
   - reset/refresh method list and results when provider changes.

Acceptance criteria:

- Mode behavior controlled only by config.
- Provider switch behavior tested for race conditions and stale state.

### Phase 3: Integrate provision retriever capabilities

1. Add `provision-retriever` adapter.
2. Wire method-list + search using transport endpoints from config.
3. Normalize payloads into canonical result model.
4. Reuse existing threshold/method interaction semantics.

Acceptance criteria:

- Provision provider functions in both single and multi mode.
- Canonical output and provenance events emitted correctly.

### Phase 4: Provenance defaults and event contract

1. Set `emitProvenance` default to `true`.
2. Emit provenance on at least:
   - initial retrieval load,
   - method change,
   - provider change,
   - retrieval errors (optional but recommended).
3. Include provider id and method in event payload.

Acceptance criteria:

- Provenance events present by default.
- Disabling via config works and is covered by tests.

### Phase 5: legal-blocks integration

1. In `legal-blocks`, add loader/resolver for JSON manifests.
2. Merge environment/tenant overrides into resolved config.
3. Pass resolved object into query-builder import/initialization API.
4. Do not allow query-builder to independently fetch manifests.

Acceptance criteria:

- `legal-blocks` can configure single or multi provider behavior from JSON.
- Invalid manifests fail with actionable diagnostics before rendering.

### Phase 6: Migration, docs, and release

1. Add migration guide from legacy usage to provider config usage.
2. Add examples:
   - no config (legacy),
   - single provider (fixed),
   - multi provider (switchable),
   - legal-blocks resolved JSON input.
3. Release in a backward-compatible minor version.

Acceptance criteria:

- Existing integrations do not break.
- New provider configuration path is documented and tested.

## 7. Testing Strategy

### Unit tests

- Config defaults and validation.
- Provider adapter resolution and fallback behavior.
- Event emission toggles (`emitProvenance` true/false).

### Component tests

- Single vs multi provider rendering and interactions.
- Provider switch state reset correctness.
- Method selection and threshold behavior per provider.

### Integration tests

- legal-blocks resolved config -> query-builder runtime behavior.
- Manifest error scenarios and diagnostics.
- Backward compatibility path with no explicit config.

## 8. Risks and Mitigations

1. **Risk: schema drift between legal-blocks and query-builder**
   - Mitigation: versioned schema and shared validator package (or shared types package).

2. **Risk: provider switch race conditions**
   - Mitigation: request token/cancellation strategy and stale response guards.

3. **Risk: inconsistent backend payload shapes**
   - Mitigation: strict adapter-level normalization to canonical model.

4. **Risk: accidental breaking change for legacy consumers**
   - Mitigation: preserve no-config defaults and run compatibility tests.

## 9. Deliverables Checklist (Before Coding Completion)

- [ ] Provider config types merged.
- [ ] Manifest schema + validator merged.
- [ ] Legacy case-law adapter merged.
- [ ] Provision retrieval adapter merged.
- [ ] Single/multi provider mode merged.
- [ ] Provenance default-on behavior merged.
- [ ] legal-blocks resolution + pass-through integration merged.
- [ ] Migration docs and examples merged.
- [ ] Test suite coverage updated and green.

## 10. Decision Log (Locked)

1. The work is an extension of `vue-legal-query-builder` (not a wrapper-only package).
2. Provider multiplicity is user-configurable (`single` vs `multi`).
3. Configuration is also manifest/JSON driven.
4. `legal-blocks` always resolves/loads manifest JSON and passes resolved config.
5. `emitProvenance` default is `true`.
