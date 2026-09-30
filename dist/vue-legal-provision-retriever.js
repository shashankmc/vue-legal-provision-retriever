import { provide as N, defineComponent as I, ref as p, computed as $, onMounted as H, openBlock as c, createElementBlock as d, toDisplayString as u, createCommentVNode as y, createElementVNode as a, Fragment as E, renderList as x, normalizeClass as S, unref as m, createTextVNode as O, normalizeStyle as F } from "vue";
const R = 0.2, z = "bm25";
function M(t) {
  if (Number.isNaN(t)) return R;
  const r = Math.min(1, Math.max(0, t));
  return Math.round(r * 100) / 100;
}
function V(t) {
  return M(t).toFixed(2);
}
function L(t) {
  return t > 0.5 ? "#2e7d5b" : t > 0.3 ? "#1b6b93" : "#e8a838";
}
function G(t) {
  return Math.max(t * 100, 2);
}
function A(t) {
  return t.toFixed(3);
}
function P(t, r) {
  return t < r;
}
function U(t, r) {
  const e = (r == null ? void 0 : r.relevant_doc_ids) ?? [], h = new Set(t);
  if (e.length === 0)
    return { precision: 0, recall: 0, f1: 0, count: h.size, hasGroundTruth: !1 };
  const v = new Set(e), _ = [...h].filter((g) => v.has(g)).length, l = h.size > 0 ? _ / h.size : 0, i = v.size > 0 ? _ / v.size : 0, f = l + i > 0 ? 2 * l * i / (l + i) : 0;
  return { precision: l, recall: i, f1: f, count: h.size, hasGroundTruth: !0 };
}
function j(t) {
  return `P=${t.precision.toFixed(2)} R=${t.recall.toFixed(2)} F1=${t.f1.toFixed(2)} (${t.count} selected)`;
}
const q = Symbol("legal-provision-retriever-host");
function W(t) {
  N(q, t);
}
const J = { class: "provision-retriever" }, K = {
  key: 0,
  class: "title"
}, Q = { class: "controls" }, X = { class: "control-group" }, Y = ["data-method", "onClick"], Z = { class: "control-group" }, ee = ["value"], te = { class: "threshold-value" }, oe = { class: "control-group" }, se = {
  key: 0,
  class: "eval-badge",
  "data-test": "eval-badge"
}, ne = {
  key: 1,
  class: "loading"
}, ae = {
  key: 2,
  class: "error"
}, le = {
  key: 3,
  class: "doc-list"
}, re = ["data-doc-id"], ie = { class: "doc-title" }, ce = { class: "doc-meta" }, de = { class: "score-row" }, ue = { class: "score-bar-bg" }, he = { class: "top-prov" }, ve = /* @__PURE__ */ I({
  __name: "ProvisionRetriever",
  props: {
    title: {},
    case: {},
    onSearch: {},
    onListMethods: {},
    groundTruth: {},
    showEvaluation: { type: Boolean, default: !1 },
    defaultMethod: { default: z },
    defaultThreshold: { default: R }
  },
  emits: ["results", "provenance"],
  setup(t, { emit: r }) {
    const e = t, h = r, v = [
      { id: "tfidf", label: "TF-IDF" },
      { id: "bm25", label: "BM25" },
      { id: "sbert", label: "SBERT" }
    ], _ = p(v), l = p(e.defaultMethod), i = p(M(e.defaultThreshold)), f = p([]), g = p(!1), b = p(null);
    W({
      search: (s) => {
        var n;
        return ((n = e.onSearch) == null ? void 0 : n.call(e, s)) ?? Promise.reject(new Error("onSearch is not set"));
      },
      listMethods: () => {
        var s;
        return ((s = e.onListMethods) == null ? void 0 : s.call(e)) ?? Promise.resolve(v);
      }
    });
    const T = $(
      () => U(
        f.value.filter((s) => !P(s.score, i.value)).map((s) => s.doc_id),
        e.groundTruth
      )
    );
    function k(s) {
      var n, o;
      return ((o = (n = e.groundTruth) == null ? void 0 : n.relevant_doc_ids) == null ? void 0 : o.includes(s)) ?? !1;
    }
    H(async () => {
      var s, n;
      try {
        _.value = await ((s = e.onListMethods) == null ? void 0 : s.call(e)) ?? v, !_.value.some((o) => o.id === l.value) && _.value.length > 0 && (l.value = ((n = _.value.find((o) => o.id === z)) == null ? void 0 : n.id) ?? _.value[0].id);
      } catch {
        _.value = v;
      }
      await w("load");
    });
    function B(s, n = {}) {
      var o;
      h("provenance", {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: s,
        target_kind: "retrieval",
        target_id: ((o = e.case) == null ? void 0 : o.case_id) ?? null,
        method: l.value,
        threshold: i.value,
        ...n
      });
    }
    async function w(s) {
      if (!e.case || !e.onSearch) {
        f.value = [];
        return;
      }
      g.value = !0, b.value = null;
      try {
        const n = await e.onSearch({
          query: e.case.fact_pattern,
          method: l.value,
          case_id: e.case.case_id
        });
        f.value = n.documents ?? [], h("results", n), B(s);
      } catch (n) {
        b.value = n instanceof Error ? n.message : "Search failed", f.value = [];
      } finally {
        g.value = !1;
      }
    }
    function C(s) {
      s !== l.value && (l.value = s, w("change_method"));
    }
    function D(s) {
      i.value = M(Number(s.target.value) / 100);
    }
    return (s, n) => (c(), d("div", J, [
      e.title ? (c(), d("h2", K, u(e.title), 1)) : y("", !0),
      a("div", Q, [
        a("div", X, [
          n[0] || (n[0] = a("label", null, "Method", -1)),
          (c(!0), d(E, null, x(_.value, (o) => (c(), d("button", {
            key: o.id,
            type: "button",
            class: S(["method-btn", { active: o.id === l.value }]),
            "data-method": o.id,
            onClick: (me) => C(o.id)
          }, u(o.label), 11, Y))), 128))
        ]),
        a("div", Z, [
          n[1] || (n[1] = a("label", null, "Threshold", -1)),
          a("input", {
            class: "threshold-slider",
            type: "range",
            min: "0",
            max: "100",
            value: Math.round(i.value * 100),
            onInput: D
          }, null, 40, ee),
          a("span", te, u(m(V)(i.value)), 1)
        ]),
        a("div", oe, [
          e.showEvaluation && T.value.hasGroundTruth ? (c(), d("span", se, u(m(j)(T.value)), 1)) : y("", !0)
        ])
      ]),
      g.value ? (c(), d("div", ne, "Searching…")) : b.value ? (c(), d("div", ae, u(b.value), 1)) : (c(), d("ul", le, [
        (c(!0), d(E, null, x(f.value, (o) => (c(), d("li", {
          key: o.doc_id,
          class: S(["doc-card", { "below-threshold": m(P)(o.score, i.value) }]),
          "data-doc-id": o.doc_id
        }, [
          a("div", ie, [
            O(u(o.title) + " ", 1),
            e.showEvaluation && e.groundTruth ? (c(), d("span", {
              key: 0,
              class: S(["gt-badge", k(o.doc_id) ? "gt-relevant" : "gt-distractor"])
            }, u(k(o.doc_id) ? "relevant" : "distractor"), 3)) : y("", !0)
          ]),
          a("div", ce, u(o.doc_id) + " · " + u(o.provisions.length) + " prov", 1),
          a("div", de, [
            a("div", ue, [
              a("div", {
                class: "score-bar",
                style: F({ width: m(G)(o.score) + "%", background: m(L)(o.score) })
              }, null, 4)
            ]),
            a("div", {
              class: "score-num",
              style: F({ color: m(L)(o.score) })
            }, u(m(A)(o.score)), 5)
          ]),
          a("div", he, "Top: " + u(o.top_provision), 1)
        ], 10, re))), 128))
      ]))
    ]));
  }
}), _e = (t, r) => {
  const e = t.__vccOpts || t;
  for (const [h, v] of r)
    e[h] = v;
  return e;
}, fe = /* @__PURE__ */ _e(ve, [["__scopeId", "data-v-5ea78d21"]]), ge = {
  install(t) {
    t.component("ProvisionRetriever", fe);
  }
};
export {
  z as DEFAULT_METHOD,
  R as DEFAULT_THRESHOLD,
  fe as ProvisionRetriever,
  ge as VueLegalProvisionRetrieverPlugin,
  ge as default,
  U as evaluateSelection,
  j as formatEvalBadge,
  A as formatScore,
  V as formatThreshold,
  P as isBelowThreshold,
  M as normaliseThreshold,
  L as scoreColor,
  G as scoreWidth
};
