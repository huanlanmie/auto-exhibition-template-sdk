import { i as e, n as t, r as n, t as r } from "../chunks/artifacts-Cjpaf3MN.js";
import { computed as i, inject as a, ref as o } from "vue";
//#region src/runtime/value-map/path.ts
function s(e) {
	return String(e || "").trim().replace(/^\//, "");
}
function c(e, t) {
	return e ? t ? `${e}.${t}` : e : t;
}
function l(e) {
	return s(e).replace(/\[(\d+)\]/g, ".$1").split(".").map((e) => e.trim()).filter(Boolean);
}
function u(e, t) {
	let n = l(t);
	if (!n.length) return e;
	let r = e;
	for (let e of n) {
		if (r == null) return;
		r = r[e];
	}
	return r;
}
//#endregion
//#region src/runtime/context/createTemplateContext.ts
var d = "/config.json", f = "/assets/template-sdk/valueMap.json", p = "template-sdk:update-value-map";
function m(e) {
	return e === void 0 ? e : JSON.parse(JSON.stringify(e));
}
async function h(e) {
	let t = await fetch(e, { cache: "no-cache" });
	if (!t.ok) throw Error(`加载 ${e} 失败：${t.status}`);
	return t.json();
}
async function g() {
	let [e, t] = await Promise.all([h(d), h(f)]);
	return {
		configJson: e,
		valueMap: t
	};
}
function _(e = {}) {
	let t = o(null), n = o(null);
	function i(e) {
		t.value = m(e.configJson), n.value = m(e.valueMap);
	}
	function a(e) {
		n.value = m(e || {});
	}
	function l() {
		typeof window > "u" || window.addEventListener("message", (e) => {
			e.origin === window.location.origin && e.data?.type === p && a(e.data?.payload?.valueMap || {});
		});
	}
	return e?.configJson === void 0 ? typeof window < "u" && typeof fetch == "function" && g().then((e) => i(e)).catch((e) => {
		console.error("[template-sdk] 自动加载模板配置失败", e);
	}) : i(r(e.configJson)), l(), { context: {
		config: t,
		valueMap: n,
		resolvePath(e, t = "") {
			let n = String(e || "").trim();
			if (!n) return s(t);
			if (n.startsWith("/")) throw Error("template-sdk useTemplateValue key 不能以 / 开头，请改为 title、timeline[0].phase 这类点路径");
			return s(c(t, n));
		},
		resolveValue(e) {
			return u(n.value, e);
		}
	} };
}
//#endregion
//#region src/runtime/context/keys.ts
var v = Symbol("template-sdk-context");
//#endregion
//#region src/runtime/context/useTemplateContext.ts
function y() {
	let e = a(v, null);
	if (!e) throw Error("useTemplateValue requires TemplateSdk to be installed before use");
	return e;
}
//#endregion
//#region src/sdk/useTemplateValue.ts
function b(e, t) {
	let n = y();
	return i(() => {
		let r = n.resolvePath(String(e || "")), i = n.resolveValue(r);
		return i === void 0 ? t : i;
	});
}
//#endregion
//#region src/sdk/index.ts
var x = { install(e, t = {}) {
	let { context: n } = _({ ...t });
	e.provide(v, n);
} };
//#endregion
export { r as buildTemplateArtifacts, t as buildTemplateJsonFiles, n as buildTemplateValueMap, x as default, b as useTemplateValue, e as validateTemplateConfig };
