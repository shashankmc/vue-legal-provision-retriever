# Migration Guide: Legacy Callbacks -> Provider and Manifest Configuration

This guide helps you move from callback-only usage to provider-driven,
source-agnostic configuration that can be resolved by `legal-blocks`.

## 1) Legacy usage (still supported)

If you currently pass only `onSearch` and `onListMethods`, your integration
continues to work.

```vue
<ProvisionRetriever
  :case="caseData"
  :on-search="search"
  :on-list-methods="listMethods"
/>
```

Use this mode while migrating incrementally.

## 2) Move to explicit provider mode (single provider)

When you want a fixed provider in the UI (no provider selector), set
`providerMode="single"` and pass `providers` + `defaultProvider`.

```ts
import { createHostProvider } from 'vue-legal-provision-retriever'

const caseLawProvider = createHostProvider({
  id: 'case-law',
  label: 'Case Law',
  capabilities: {
    supportsMethodListing: false,
    supportsThreshold: false,
  },
  listMethods: async () => [],
  search: async (args) => fetch('/api/case-law/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  }).then((r) => r.json()),
})
```

```vue
<ProvisionRetriever
  :case="caseData"
  provider-mode="single"
  :providers="[caseLawProvider]"
  default-provider="case-law"
/>
```

## 3) Enable multi-provider mode

To let users switch sources (for example Case Law vs Provisions), use
`providerMode="multi"` and pass multiple providers.

```vue
<ProvisionRetriever
  :case="caseData"
  provider-mode="multi"
  :providers="[caseLawProvider, provisionsProvider]"
  default-provider="case-law"
/>
```

In multi mode, the provider selector is shown only when more than one provider
is configured.

## 4) Migrate to manifest-driven config (legal-blocks path)

`legal-blocks` should load and resolve JSON manifests, then pass the resolved
manifest object into this package.

### Example manifest

```json
{
  "schemaVersion": "1",
  "providerMode": "multi",
  "defaultProvider": "case-law",
  "features": {
    "emitProvenance": true,
    "showEvaluation": false
  },
  "providers": [
    {
      "id": "case-law",
      "label": "Case Law",
      "type": "case-law",
      "transport": {
        "searchEndpoint": "/api/case-law/search"
      }
    },
    {
      "id": "provisions",
      "label": "Provisions",
      "type": "provision-retriever",
      "transport": {
        "methodsEndpoint": "/api/provisions/methods",
        "searchEndpoint": "/api/provisions/search"
      }
    }
  ]
}
```

### Build providers from manifest

```ts
import { createProvidersFromManifest } from 'vue-legal-provision-retriever'

const providers = createProvidersFromManifest({
  manifest: resolvedManifestFromLegalBlocks,
  execute: async ({ endpoint, method, query, body }) => {
    const url = method === 'GET' && query
      ? `${endpoint}?${new URLSearchParams(Object.entries(query).filter(([, v]) => v != null) as [string, string][])}`
      : endpoint

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    })

    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    return response.json()
  },
})
```

Then wire those providers to `ProvisionRetriever`.

## 5) Provenance behavior during migration

- `emitProvenance` defaults to `true`.
- Provenance now includes `provider_id` in emitted payloads.
- Optional: set `emitErrorProvenance` to emit `search_error` events on failures.

## 6) Common migration checks

- Ensure `defaultProvider` exists in `providers`.
- For API-controlled Case Law, keep method and threshold controls off:
  `supportsMethodListing: false`, `supportsThreshold: false`.
- Prefer manifest validation before mounting UI:
  `validateQueryBuilderManifest(...)`.
