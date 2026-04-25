import { computed as e, inject as t, ref as n } from "vue";
//#region src/runtime/value-map/normalize.ts
function r(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function i(e) {
	return Array.isArray(e) ? e : [];
}
function a(e) {
	return e === void 0 ? e : JSON.parse(JSON.stringify(e));
}
function o(e) {
	switch (e?.type) {
		case "image": return { url: "" };
		case "video": return {
			url: "",
			poster: ""
		};
		case "array": return [];
		default: return "";
	}
}
function s(e, t = e?.value) {
	return e?.type !== "array" || !Array.isArray(t) ? [] : t.map((e) => r(e) ? a(e) : {});
}
function c(e, t) {
	switch (e?.type) {
		case "image": return typeof t == "string" ? { url: t } : r(t) ? a(t) : { url: "" };
		case "video": return typeof t == "string" ? {
			url: t,
			poster: ""
		} : r(t) ? a(t) : {
			url: "",
			poster: ""
		};
		case "array": return s(e, t);
		default: return a(t);
	}
}
function l(e) {
	return e?.value === void 0 ? e?.defaultValue === void 0 ? o(e) : c(e, e.defaultValue) : c(e, e.value);
}
function u(e) {
	let t = {};
	return i(e?.dataSchema?.fields).forEach((e) => {
		let n = String(e?.key || "").trim();
		n && (t[n] = l(e));
	}), t;
}
//#endregion
//#region src/runtime/schema/validation.ts
var d = [
	"string",
	"number",
	"boolean",
	"image",
	"video",
	"array"
], f = ["add", "delete"];
function p(e, t, n) {
	e.push({
		path: t,
		message: n
	});
}
function m(e, t, n, r) {
	e !== void 0 && typeof e != "string" && p(r, t, `${n} 必须是字符串`);
}
function h(e, t, n, i) {
	e !== void 0 && !r(e) && p(i, t, `${n} 必须是对象`);
}
function g(e, t, n, r) {
	if (e === void 0) return;
	if (!Array.isArray(e)) {
		p(r, t, `${n} 必须是字符串数组`);
		return;
	}
	let i = /* @__PURE__ */ new Set();
	e.forEach((e, n) => {
		let a = `${t}[${n}]`;
		if (typeof e != "string") {
			p(r, a, "操作项必须是字符串");
			return;
		}
		if (!f.includes(e)) {
			p(r, a, `仅支持以下操作：${f.join(", ")}`);
			return;
		}
		if (i.has(e)) {
			p(r, a, `操作 ${e} 重复`);
			return;
		}
		i.add(e);
	});
}
function _(e, t, n, r) {
	e !== void 0 && m(e, t, n, r);
}
function v(e, t, n, r, i) {
	e !== void 0 && (t === "number" && typeof e != "number" && p(i, n, `${r} 必须是数字`), t === "boolean" && typeof e != "boolean" && p(i, n, `${r} 必须是布尔值`), t === "string" && typeof e != "string" && p(i, n, `${r} 必须是字符串`));
}
function y(e, t, n, r, i) {
	let a = e.type;
	switch (a) {
		case "string":
		case "number":
		case "boolean":
			v(t, a, n, r, i);
			return;
		case "image":
		case "video":
			_(t, n, r, i);
			return;
		case "array":
			E(t, n, r, i);
			return;
		default: return;
	}
}
function b(e) {
	return Array.isArray(e) ? "array" : e === null ? "null" : r(e) ? "object" : typeof e;
}
function x(e) {
	switch (e) {
		case "array": return "数组";
		case "object": return "对象";
		case "string": return "字符串";
		case "number": return "数字";
		case "boolean": return "布尔值";
		case "null": return "null";
		default: return e;
	}
}
function S(e, t, n, r, i) {
	let a = Object.keys(e), o = Object.keys(t), s = a.filter((e) => !o.includes(e)), c = o.filter((e) => !a.includes(e));
	s.length && p(i, n, `结构必须与 ${r} 一致，缺少字段：${s.join(", ")}`), c.length && p(i, n, `结构必须与 ${r} 一致，存在多余字段：${c.join(", ")}`), a.forEach((a) => {
		o.includes(a) && w(e[a], t[a], `${n}.${a}`, `${r}.${a}`, i);
	});
}
function C(e, t, n, i, a) {
	if (!e.length) return;
	let o = e[0];
	r(o) && t.forEach((e, t) => {
		r(e) && S(o, e, `${n}[${t}]`, `${i}[0]`, a);
	});
}
function w(e, t, n, i, a) {
	let o = b(e), s = b(t);
	if (o !== s) {
		p(a, n, `结构必须与 ${i} 一致，期望 ${x(o)}，实际 ${x(s)}`);
		return;
	}
	if (r(e) && r(t)) {
		S(e, t, n, i, a);
		return;
	}
	Array.isArray(e) && Array.isArray(t) && C(e, t, n, i, a);
}
function T(e, t, n) {
	let i = /* @__PURE__ */ new Set();
	e.forEach((e, a) => {
		if (!r(e) || typeof e.key != "string" || !e.key.trim()) return;
		let o = e.key.trim(), s = `${t}[${a}]`;
		if (i.has(o)) {
			p(n, `${s}.key`, `字段 key ${o} 重复`);
			return;
		}
		i.add(o);
	});
}
function E(e, t, n, i) {
	if (e === void 0) return;
	if (!Array.isArray(e)) {
		p(i, t, `${n} 必须是数组`);
		return;
	}
	T(e, t, i);
	let a = e.find((e) => r(e));
	e.forEach((e, n) => {
		O(e, `${t}[${n}]`, i), a && a !== e && r(e) && S(a, e, `${t}[${n}]`, `${t}[0]`, i);
	});
}
function D(e, t, n) {
	g(e.operations, `${t}.operations`, "字段 operations", n), E(e.value, `${t}.value`, "字段 value", n), E(e.defaultValue, `${t}.defaultValue`, "字段 defaultValue", n);
}
function O(e, t, n) {
	if (!r(e)) {
		p(n, t, "字段节点必须是对象");
		return;
	}
	let i = e.key, a = e.type;
	if ((typeof i != "string" || !i.trim()) && p(n, `${t}.key`, "字段 key 必须是非空字符串"), typeof a != "string" || !d.includes(a)) {
		p(n, `${t}.type`, `字段 type 必须是受支持的类型：${d.join(", ")}`);
		return;
	}
	switch (m(e.label, `${t}.label`, "字段 label", n), m(e.path, `${t}.path`, "字段 path", n), a) {
		case "string":
		case "number":
		case "boolean":
			y(e, e.value, `${t}.value`, "字段 value", n), v(e.defaultValue, a, `${t}.defaultValue`, "字段 defaultValue", n);
			break;
		case "image":
		case "video":
			y(e, e.value, `${t}.value`, "字段 value", n), _(e.defaultValue, `${t}.defaultValue`, "字段 defaultValue", n);
			break;
		case "array":
			D(e, t, n);
			break;
		default: break;
	}
}
function k(e, t, n) {
	if (!Array.isArray(e)) {
		p(n, t, "必须是字段数组");
		return;
	}
	T(e, t, n), e.forEach((e, r) => {
		O(e, `${t}[${r}]`, n);
	});
}
function A(e) {
	let t = [];
	if (!r(e)) p(t, "configJson", "必须是对象");
	else {
		h(e.meta, "configJson.meta", "meta", t), h(e.functions, "configJson.functions", "functions", t), e.dataSchema !== void 0 && !r(e.dataSchema) && p(t, "configJson.dataSchema", "dataSchema 必须是对象");
		let n = r(e.dataSchema) ? e.dataSchema.fields : void 0;
		n !== void 0 && k(n, "configJson.dataSchema.fields", t);
	}
	if (t.length) {
		let e = t.map((e) => `${e.path}: ${e.message}`).join("\n");
		throw Error(`template-sdk configJson 校验失败:\n${e}`);
	}
	return a(e);
}
//#endregion
//#region src/runtime/schema/artifacts.ts
function j(e) {
	return u(A(e));
}
function M(e) {
	let t = A(e);
	return {
		configJson: t,
		valueMap: u(t)
	};
}
function N(e, t = 2) {
	let n = M(e);
	return {
		configJson: JSON.stringify(n.configJson, null, t),
		valueMap: JSON.stringify(n.valueMap, null, t)
	};
}
//#endregion
//#region src/runtime/value-map/path.ts
function P(e) {
	return String(e || "").trim().replace(/^\//, "");
}
function F(e, t) {
	return e ? t ? `${e}.${t}` : e : t;
}
function I(e) {
	return P(e).replace(/\[(\d+)\]/g, ".$1").split(".").map((e) => e.trim()).filter(Boolean);
}
function L(e, t) {
	let n = I(t);
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
function R(e) {
	let t = M(e?.configJson), r = n(t.configJson), i = n(t.valueMap);
	return { context: {
		config: r,
		valueMap: i,
		resolvePath(e, t = "") {
			let n = String(e || "").trim();
			if (!n) return P(t);
			if (n.startsWith("/")) throw Error("template-sdk useTemplateValue key 不能以 / 开头，请改为 title、timeline[0].phase 这类点路径");
			return P(F(t, n));
		},
		resolveValue(e) {
			return L(i.value, e);
		}
	} };
}
//#endregion
//#region src/runtime/context/keys.ts
var z = Symbol("template-sdk-context");
//#endregion
//#region src/runtime/context/useTemplateContext.ts
function B() {
	let e = t(z, null);
	if (!e) throw Error("useTemplateValue requires TemplateSdk to be installed before use");
	return e;
}
//#endregion
//#region src/sdk/useTemplateValue.ts
function V(t, n) {
	let r = B();
	return e(() => {
		let e = r.resolvePath(String(t || "")), i = r.resolveValue(e);
		return i === void 0 ? n : i;
	});
}
//#endregion
//#region src/sdk/index.ts
var H = { install(e, t) {
	let { context: n } = R({ ...t });
	e.provide(z, n);
} };
//#endregion
export { M as buildTemplateArtifacts, N as buildTemplateJsonFiles, j as buildTemplateValueMap, H as default, V as useTemplateValue, A as validateTemplateConfig };
