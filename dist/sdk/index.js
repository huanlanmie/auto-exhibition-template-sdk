import { i as e, n as t, r as n, t as r } from "../chunks/artifacts-DPTHD8wj.js";
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
function d(e) {
	let t = r(e?.configJson), n = o(t.configJson), i = o(t.valueMap);
	return { context: {
		config: n,
		valueMap: i,
		resolvePath(e, t = "") {
			let n = String(e || "").trim();
			if (!n) return s(t);
			if (n.startsWith("/")) throw Error("template-sdk useTemplateValue key 不能以 / 开头，请改为 title、timeline[0].phase 这类点路径");
			return s(c(t, n));
		},
		resolveValue(e) {
			return u(i.value, e);
		}
	} };
}
//#endregion
//#region src/runtime/context/keys.ts
var f = Symbol("template-sdk-context");
//#endregion
//#region src/runtime/context/useTemplateContext.ts
function p() {
	let e = a(f, null);
	if (!e) throw Error("useTemplateValue requires TemplateSdk to be installed before use");
	return e;
}
//#endregion
//#region src/sdk/useTemplateValue.ts
function m(e, t) {
	let n = p();
	return i(() => {
		let r = n.resolvePath(String(e || "")), i = n.resolveValue(r);
		return i === void 0 ? t : i;
	});
}
//#endregion
//#region src/sdk/index.ts
var h = { install(e, t) {
	let { context: n } = d({ ...t });
	e.provide(f, n);
} };
//#endregion
export { r as buildTemplateArtifacts, t as buildTemplateJsonFiles, n as buildTemplateValueMap, h as default, m as useTemplateValue, e as validateTemplateConfig };
