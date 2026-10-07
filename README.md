# vue-legal-provision-retriever

BlueLab provision retriever: a method picker, a threshold slider, ranked
documents with score bars and an optional evaluation badge. Takes **`case@1`**
in, gives **`ranked-provisions@1`** out.

This package never calls an API. It builds a search and hands the results back
to you: the host makes the requests, so no credential reaches the browser.

```bash
npm install vue-legal-provision-retriever vue
```

```vue
<template>
  <ProvisionRetriever
    :case="case"
    :on-search="search"
    :on-list-methods="listMethods"
    :default-method="'bm25'"
    :default-threshold="0.2"
    @results="onResults"
    @provenance="onProvenance"
  />
</template>

<script setup lang="ts">
import { ProvisionRetriever } from 'vue-legal-provision-retriever'
import 'vue-legal-provision-retriever/style.css'

const listMethods = () => fetch('/api/methods').then((r) => r.json())
const search = (args: { query: string; method: string; case_id?: string }) =>
  fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  }).then((r) => r.json())
const onResults = (data: unknown) => console.log(data)
const onProvenance = (event: unknown) => console.log(event)
</script>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `case` | `CaseV1 \| null` | — | The case to search for. |
| `onSearch` | `(args) => Promise<RankedProvisionsV1>` | — | Runs the search. |
| `onListMethods` | `() => Promise<MethodOption[]>` | built-ins | Lists the methods the server offers. |
| `groundTruth` | `{ relevant_doc_ids: string[] } \| null` | — | For the evaluation badge. |
| `providerMode` | `'single' \| 'multi'` | `'single'` | Whether provider switching is enabled. |
| `providers` | `RetrievalProvider[]` | — | Optional provider registry for runtime provider selection. |
| `defaultProvider` | `string` | first provider | Preferred provider when `providers` are supplied. |
| `showEvaluation` | `boolean` | `false` | Whether research mode is on. |
| `emitProvenance` | `boolean` | `true` | Whether `@provenance` events are emitted. |
| `emitErrorProvenance` | `boolean` | `false` | Whether failed retrievals emit `search_error` provenance. |
| `defaultMethod` | `string` | `'bm25'` | Method selected on mount. |
| `defaultThreshold` | `number` | `0.2` | Threshold on mount. |
| `title` | `string` | — | Optional heading. |

## Events

| Event | Payload | Description |
|---|---|---|
| `@results` | `RankedProvisionsV1` | Emitted with every search result. |
| `@provenance` | `ProvenanceEventV1 & { provider_id?: string }` | Emitted on retrieval actions; includes active provider id. |

## Types

| Type | Shape |
|---|---|
| `CaseV1` (`case@1`) | from `legal-provision-types` |
| `RankedProvisionsV1` (`ranked-provisions@1`) | from `legal-provision-types` |
| `MethodOption` | `{ id, label }` |
| `GroundTruth` | `{ relevant_doc_ids: string[] }` |

Pure helpers are exported too: `normaliseThreshold`, `formatThreshold`,
`scoreColor`, `scoreWidth`, `formatScore`, `isBelowThreshold`,
`evaluateSelection`, `formatEvalBadge`.

## Provider configuration foundations

This package now also exports phase-1 provider/config helpers intended for the
`vue-legal-query-builder` extension work:

- `resolveQueryBuilderConfig` - resolves defaults (`providerMode: 'single'`,
  built-in `case-law` provider, `emitProvenance: true`).
- `createHostProvider` - adapts host callbacks into a typed provider contract.
- Types for provider manifests and resolved config, including single vs multi
  provider mode.

These exports are additive and do not change the existing `ProvisionRetriever`
component API.

Provider capabilities can drive control visibility. For example, set
`supportsMethodListing: false` and `supportsThreshold: false` for API-controlled
providers like case law to hide method/threshold controls.

`resolveQueryBuilderConfig` now auto-applies those capability defaults for
`type: 'case-law'` unless explicitly overridden.

## Development

```bash
npm install
npm run dev    # local demo page at http://localhost:5173
npm test        # vitest component + helper tests
npm run build   # library build to dist/
```

The demo page lives in `index.html` + `demo/App.vue` and includes mock providers
for `single` and `multi` provider mode testing.

Tests map to Appendix D.2 (#7, #8, #9, #13, #14, #15) and D.5 (#39, #40) of the
BlueLab modularization plan.
