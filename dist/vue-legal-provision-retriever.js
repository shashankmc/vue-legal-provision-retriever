import { provide as ce, defineComponent as ve, computed as _, ref as m, onMounted as he, openBlock as s, createElementBlock as l, toDisplayString as u, createCommentVNode as y, createElementVNode as d, withKeys as fe, Fragment as F, renderList as B, unref as b, normalizeClass as $, createTextVNode as K, normalizeStyle as W } from "vue";
import { withProviderTypeDefaults as pe, resolveQueryBuilderConfig as Z, resolveQueryBuilderConfigFromManifest as ee, methodsWithDependencies as _e, unmetDependencies as ye, buildDependencyScaffold as be, dependencyHint as O } from "legal-retrieval-types";
import { resolveQueryBuilderConfig as ht, resolveQueryBuilderConfigFromManifest as ft, validateQueryBuilderManifest as pt } from "legal-retrieval-types";
function me(o) {
  return {
    id: o.id,
    label: o.label,
    capabilities: o.capabilities,
    search: o.search,
    listMethods: o.listMethods ?? (() => Promise.resolve([]))
  };
}
function ge(o) {
  const n = pe(o.config);
  return {
    id: n.id,
    label: n.label,
    capabilities: n.capabilities,
    listMethods: async (i) => {
      var c;
      return ((c = n.capabilities) == null ? void 0 : c.supportsMethodListing) === !1 || !n.transport.methodsEndpoint ? [] : (n.transport.methodsMethod ?? "GET") === "GET" ? o.execute({
        endpoint: n.transport.methodsEndpoint,
        method: "GET",
        query: { case_id: i.case_id }
      }) : o.execute({
        endpoint: n.transport.methodsEndpoint,
        method: "POST",
        body: { case_id: i.case_id }
      });
    },
    search: async (i) => (n.transport.searchMethod ?? "POST") === "GET" ? o.execute({
      endpoint: n.transport.searchEndpoint,
      method: "GET",
      query: {
        query: i.query,
        method: i.method,
        case_id: i.case_id
      }
    }) : o.execute({
      endpoint: n.transport.searchEndpoint,
      method: "POST",
      body: {
        query: i.query,
        method: i.method,
        case_id: i.case_id
      }
    })
  };
}
function te(o) {
  return Z(o.config).providers.map((i) => ge({ config: i, execute: o.execute }));
}
function it(o) {
  const n = ee(o.manifest);
  return te({ config: n, execute: o.execute });
}
function Pe(o) {
  var c, f;
  const n = Z(o.config), i = te({ config: n, execute: o.execute }), t = n.providers.find((g) => g.id === n.defaultProvider);
  return {
    providerMode: n.providerMode,
    defaultProvider: n.defaultProvider,
    providers: i,
    showEvaluation: n.features.showEvaluation,
    emitProvenance: n.features.emitProvenance,
    defaultMethod: (c = t == null ? void 0 : t.defaults) == null ? void 0 : c.method,
    defaultThreshold: (f = t == null ? void 0 : t.defaults) == null ? void 0 : f.threshold
  };
}
function dt(o) {
  const n = ee(o.manifest);
  return Pe({ config: n, execute: o.execute });
}
const oe = 0.2, J = "bm25";
function z(o) {
  if (Number.isNaN(o)) return oe;
  const n = Math.min(1, Math.max(0, o));
  return Math.round(n * 100) / 100;
}
function Me(o) {
  return z(o).toFixed(2);
}
function X(o) {
  return o > 0.5 ? "#2e7d5b" : o > 0.3 ? "#1b6b93" : "#e8a838";
}
function ke(o) {
  return Math.max(o * 100, 2);
}
function Se(o) {
  return o.toFixed(3);
}
function Y(o, n) {
  return o < n;
}
function Te(o, n) {
  const i = (n == null ? void 0 : n.relevant_doc_ids) ?? [], t = new Set(o);
  if (i.length === 0)
    return { precision: 0, recall: 0, f1: 0, count: t.size, hasGroundTruth: !1 };
  const c = new Set(i), f = [...t].filter((k) => c.has(k)).length, g = t.size > 0 ? f / t.size : 0, h = c.size > 0 ? f / c.size : 0, P = g + h > 0 ? 2 * g * h / (g + h) : 0;
  return { precision: g, recall: h, f1: P, count: t.size, hasGroundTruth: !0 };
}
function we(o) {
  return `P=${o.precision.toFixed(2)} R=${o.recall.toFixed(2)} F1=${o.f1.toFixed(2)} (${o.count} selected)`;
}
const Ee = Symbol("legal-provision-retriever-host");
function xe(o) {
  ce(Ee, o);
}
const Ce = { class: "provision-retriever" }, qe = {
  key: 0,
  class: "title"
}, Fe = { class: "controls" }, Be = {
  key: 0,
  class: "control-group query-group"
}, De = ["value"], Re = {
  key: 1,
  class: "control-group"
}, Ie = ["value"], Le = ["value"], $e = {
  key: 2,
  class: "control-group"
}, Oe = ["data-method", "disabled", "title", "onClick"], ze = {
  key: 3,
  class: "control-group"
}, Ge = ["value"], Ne = { class: "threshold-value" }, He = { class: "control-group" }, Qe = {
  key: 0,
  class: "eval-badge",
  "data-test": "eval-badge"
}, Ve = {
  key: 1,
  class: "dependency-notice",
  "data-test": "dependency-notice"
}, Ue = {
  key: 0,
  class: "dependency-blocked"
}, je = ["data-blocked-method"], Ae = {
  key: 1,
  class: "dependency-scaffold",
  "data-test": "dependency-scaffold"
}, Ke = {
  key: 2,
  class: "loading"
}, We = {
  key: 3,
  class: "error"
}, Je = {
  key: 4,
  class: "doc-list"
}, Xe = ["data-doc-id"], Ye = { class: "doc-title" }, Ze = { class: "doc-meta" }, et = { class: "score-row" }, tt = { class: "score-bar-bg" }, ot = { class: "top-prov" }, rt = /* @__PURE__ */ ve({
  __name: "ProvisionRetriever",
  props: {
    title: {},
    case: {},
    query: {},
    autoSearch: { type: Boolean, default: !0 },
    onSearch: {},
    onListMethods: {},
    onProbeDependencies: {},
    groundTruth: {},
    providerMode: {},
    providers: {},
    defaultProvider: {},
    showEvaluation: { type: Boolean, default: !1 },
    emitProvenance: { type: Boolean, default: !0 },
    emitErrorProvenance: { type: Boolean, default: !1 },
    defaultMethod: { default: J },
    defaultThreshold: { default: oe }
  },
  emits: ["results", "provenance", "update:threshold"],
  setup(o, { expose: n, emit: i }) {
    var j;
    const t = o, c = i, f = [
      { id: "tfidf", label: "TF-IDF" },
      { id: "bm25", label: "BM25" },
      { id: "sbert", label: "SBERT" }
    ], g = me({
      id: "case-law",
      label: "Case Law",
      search: (r) => {
        var a;
        return ((a = t.onSearch) == null ? void 0 : a.call(t, r)) ?? Promise.reject(new Error("onSearch is not set"));
      },
      listMethods: () => {
        var r;
        return ((r = t.onListMethods) == null ? void 0 : r.call(t)) ?? Promise.resolve(f);
      }
    }), h = _(
      () => {
        var r;
        return (r = t.providers) != null && r.length ? t.providers : [g];
      }
    ), P = m(t.defaultProvider ?? h.value[0].id), k = _(() => h.value.find((r) => r.id === P.value) ?? h.value[0]), re = _(() => t.providerMode === "multi" && h.value.length > 1), G = _(() => {
      var r;
      return (((r = t.providers) == null ? void 0 : r.length) ?? 0) > 0;
    }), ae = _(() => v.value.length > 0), D = _(() => {
      var r;
      return ((r = k.value.capabilities) == null ? void 0 : r.supportsThreshold) !== !1;
    }), v = m(f), S = m(t.defaultMethod), R = m(t.query ?? ((j = t.case) == null ? void 0 : j.fact_pattern) ?? ""), T = m(z(t.defaultThreshold)), w = m([]), I = m(!1), x = m(null);
    let C = 0;
    const q = m(!1), ne = _(() => _e(v.value).length > 0), N = _(() => v.value.filter((r) => ye(r).length > 0)), se = _(() => be(v.value));
    async function le(r) {
      if (!t.onProbeDependencies) return r;
      try {
        return await t.onProbeDependencies(r);
      } catch {
        return r;
      }
    }
    xe({
      search: (r) => {
        var a;
        return ((a = t.onSearch) == null ? void 0 : a.call(t, r)) ?? Promise.reject(new Error("onSearch is not set"));
      },
      listMethods: () => {
        var r;
        return ((r = t.onListMethods) == null ? void 0 : r.call(t)) ?? Promise.resolve(f);
      }
    });
    const H = _(
      () => Te(
        w.value.filter((r) => !D.value || !Y(r.score, T.value)).map((r) => r.doc_id),
        t.groundTruth
      )
    );
    function Q(r) {
      var a, e;
      return ((e = (a = t.groundTruth) == null ? void 0 : a.relevant_doc_ids) == null ? void 0 : e.includes(r)) ?? !1;
    }
    he(async () => {
      h.value.some((r) => r.id === P.value) || (P.value = h.value[0].id), await V(), t.autoSearch && await E("load");
    });
    async function V() {
      var e, M, L, A;
      if (((e = k.value.capabilities) == null ? void 0 : e.supportsMethodListing) === !1) {
        v.value = [];
        return;
      }
      let r;
      try {
        const p = await k.value.listMethods({
          case_id: (M = t.case) == null ? void 0 : M.case_id
        });
        r = p.length > 0 ? p : G.value ? [] : f;
      } catch {
        r = G.value ? [] : f;
      }
      v.value = await le(r);
      const a = (p) => p.available !== !1;
      !v.value.some((p) => p.id === S.value && a(p)) && v.value.length > 0 && (S.value = ((L = v.value.find((p) => p.id === J && a(p))) == null ? void 0 : L.id) ?? ((A = v.value.find(a)) == null ? void 0 : A.id) ?? v.value[0].id);
    }
    function U(r, a = {}) {
      var e;
      t.emitProvenance && c("provenance", {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: r,
        target_kind: "retrieval",
        target_id: ((e = t.case) == null ? void 0 : e.case_id) ?? null,
        method: S.value,
        threshold: T.value,
        provider_id: k.value.id,
        ...a
      });
    }
    async function E(r) {
      if (!t.case) {
        w.value = [];
        return;
      }
      const a = ++C;
      I.value = !0, x.value = null;
      try {
        const e = await k.value.search({
          query: R.value,
          method: S.value,
          case_id: t.case.case_id
        });
        if (a !== C) return;
        w.value = e.documents ?? [], c("results", e), U(r);
      } catch (e) {
        if (a !== C) return;
        const M = e instanceof Error ? e.message : "Search failed";
        x.value = M, w.value = [], t.emitErrorProvenance && U("search_error", {
          reason: M
        });
      } finally {
        if (a !== C) return;
        I.value = !1;
      }
    }
    function ie(r) {
      if (r === S.value) return;
      const a = v.value.find((e) => e.id === r);
      (a == null ? void 0 : a.available) !== !1 && (S.value = r, E("change_method"));
    }
    function de(r) {
      T.value = z(Number(r.target.value) / 100), c("update:threshold", T.value);
    }
    async function ue(r) {
      const a = r.target.value;
      a !== P.value && (P.value = a, w.value = [], await V(), await E("change_provider"));
    }
    return n({ search: () => E("search") }), (r, a) => (s(), l("div", Ce, [
      t.title ? (s(), l("h2", qe, u(t.title), 1)) : y("", !0),
      d("div", Fe, [
        t.autoSearch ? y("", !0) : (s(), l("div", Be, [
          a[4] || (a[4] = d("label", null, "Query", -1)),
          d("input", {
            class: "query-input",
            type: "text",
            value: R.value,
            placeholder: "Describe what you are looking for…",
            "data-test": "query-input",
            onInput: a[0] || (a[0] = (e) => R.value = e.target.value),
            onKeyup: a[1] || (a[1] = fe((e) => E("search"), ["enter"]))
          }, null, 40, De),
          d("button", {
            type: "button",
            class: "search-btn",
            "data-test": "search",
            onClick: a[2] || (a[2] = (e) => E("search"))
          }, " Search ")
        ])),
        re.value ? (s(), l("div", Re, [
          a[5] || (a[5] = d("label", null, "Provider", -1)),
          d("select", {
            class: "provider-select",
            value: P.value,
            onChange: ue
          }, [
            (s(!0), l(F, null, B(h.value, (e) => (s(), l("option", {
              key: e.id,
              value: e.id
            }, u(e.label), 9, Le))), 128))
          ], 40, Ie)
        ])) : y("", !0),
        ae.value ? (s(), l("div", $e, [
          a[6] || (a[6] = d("label", null, "Method", -1)),
          (s(!0), l(F, null, B(v.value, (e) => {
            var M;
            return s(), l("button", {
              key: e.id,
              type: "button",
              class: $(["method-btn", { active: e.id === S.value, unavailable: e.available === !1 }]),
              "data-method": e.id,
              disabled: e.available === !1,
              title: e.available === !1 ? e.unavailableReason || `Requires: ${b(O)(e)}` : (M = e.dependencies) != null && M.length ? `Requires: ${b(O)(e)}` : void 0,
              onClick: (L) => ie(e.id)
            }, u(e.label), 11, Oe);
          }), 128))
        ])) : y("", !0),
        D.value ? (s(), l("div", ze, [
          a[7] || (a[7] = d("label", null, "Threshold", -1)),
          d("input", {
            class: "threshold-slider",
            type: "range",
            min: "0",
            max: "100",
            value: Math.round(T.value * 100),
            onInput: de
          }, null, 40, Ge),
          d("span", Ne, u(b(Me)(T.value)), 1)
        ])) : y("", !0),
        d("div", He, [
          t.showEvaluation && H.value.hasGroundTruth ? (s(), l("span", Qe, u(b(we)(H.value)), 1)) : y("", !0)
        ])
      ]),
      ne.value ? (s(), l("div", Ve, [
        d("button", {
          type: "button",
          class: "dependency-toggle",
          onClick: a[3] || (a[3] = (e) => q.value = !q.value)
        }, u(q.value ? "▾" : "▸") + " Backend dependencies ", 1),
        N.value.length ? (s(), l("ul", Ue, [
          (s(!0), l(F, null, B(N.value, (e) => (s(), l("li", {
            key: e.id,
            "data-blocked-method": e.id
          }, [
            d("strong", null, u(e.label), 1),
            K(" unavailable — " + u(e.unavailableReason || `requires ${b(O)(e)}`), 1)
          ], 8, je))), 128))
        ])) : y("", !0),
        q.value ? (s(), l("pre", Ae, u(se.value), 1)) : y("", !0)
      ])) : y("", !0),
      I.value ? (s(), l("div", Ke, "Searching…")) : x.value ? (s(), l("div", We, u(x.value), 1)) : (s(), l("ul", Je, [
        (s(!0), l(F, null, B(w.value, (e) => (s(), l("li", {
          key: e.doc_id,
          class: $(["doc-card", { "below-threshold": D.value && b(Y)(e.score, T.value) }]),
          "data-doc-id": e.doc_id
        }, [
          d("div", Ye, [
            K(u(e.title) + " ", 1),
            t.showEvaluation && t.groundTruth ? (s(), l("span", {
              key: 0,
              class: $(["gt-badge", Q(e.doc_id) ? "gt-relevant" : "gt-distractor"])
            }, u(Q(e.doc_id) ? "relevant" : "distractor"), 3)) : y("", !0)
          ]),
          d("div", Ze, u(e.doc_id) + " · " + u(e.provisions.length) + " prov", 1),
          d("div", et, [
            d("div", tt, [
              d("div", {
                class: "score-bar",
                style: W({ width: b(ke)(e.score) + "%", background: b(X)(e.score) })
              }, null, 4)
            ]),
            d("div", {
              class: "score-num",
              style: W({ color: b(X)(e.score) })
            }, u(b(Se)(e.score)), 5)
          ]),
          d("div", ot, "Top: " + u(e.top_provision), 1)
        ], 10, Xe))), 128))
      ]))
    ]));
  }
}), at = (o, n) => {
  const i = o.__vccOpts || o;
  for (const [t, c] of n)
    i[t] = c;
  return i;
}, nt = /* @__PURE__ */ at(rt, [["__scopeId", "data-v-f4d210c6"]]), ut = {
  install(o) {
    o.component("ProvisionRetriever", nt);
  }
};
export {
  J as DEFAULT_METHOD,
  oe as DEFAULT_THRESHOLD,
  nt as ProvisionRetriever,
  ut as VueLegalProvisionRetrieverPlugin,
  me as createHostProvider,
  te as createProvidersFromConfig,
  it as createProvidersFromManifest,
  Pe as createProvisionRetrieverOptionsFromConfig,
  dt as createProvisionRetrieverOptionsFromManifest,
  ge as createTransportProvider,
  ut as default,
  Te as evaluateSelection,
  we as formatEvalBadge,
  Se as formatScore,
  Me as formatThreshold,
  Y as isBelowThreshold,
  z as normaliseThreshold,
  ht as resolveQueryBuilderConfig,
  ft as resolveQueryBuilderConfigFromManifest,
  X as scoreColor,
  ke as scoreWidth,
  pt as validateQueryBuilderManifest
};
