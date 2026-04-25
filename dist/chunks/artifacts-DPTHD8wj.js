//#region src/runtime/value-map/normalize.ts
function e(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function t(e) {
	return Array.isArray(e) ? e : [];
}
function n(e) {
	return e === void 0 ? e : JSON.parse(JSON.stringify(e));
}
function r(e) {
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
function i(t, r = t?.value) {
	return t?.type !== "array" || !Array.isArray(r) ? [] : r.map((t) => e(t) ? n(t) : {});
}
function a(t, r) {
	switch (t?.type) {
		case "image": return typeof r == "string" ? { url: r } : e(r) ? n(r) : { url: "" };
		case "video": return typeof r == "string" ? {
			url: r,
			poster: ""
		} : e(r) ? n(r) : {
			url: "",
			poster: ""
		};
		case "array": return i(t, r);
		default: return n(r);
	}
}
function o(e) {
	return e?.value === void 0 ? e?.defaultValue === void 0 ? r(e) : a(e, e.defaultValue) : a(e, e.value);
}
function s(e) {
	let n = {};
	return t(e?.dataSchema?.fields).forEach((e) => {
		let t = String(e?.key || "").trim();
		t && (n[t] = o(e));
	}), n;
}
//#endregion
//#region src/runtime/schema/validation.ts
var c = [
	"string",
	"number",
	"boolean",
	"image",
	"video",
	"array"
], l = ["add", "delete"];
function u(e, t, n) {
	e.push({
		path: t,
		message: n
	});
}
function d(e, t, n, r) {
	e !== void 0 && typeof e != "string" && u(r, t, `${n} 必须是字符串`);
}
function f(t, n, r, i) {
	t !== void 0 && !e(t) && u(i, n, `${r} 必须是对象`);
}
function p(e, t, n, r) {
	if (e === void 0) return;
	if (!Array.isArray(e)) {
		u(r, t, `${n} 必须是字符串数组`);
		return;
	}
	let i = /* @__PURE__ */ new Set();
	e.forEach((e, n) => {
		let a = `${t}[${n}]`;
		if (typeof e != "string") {
			u(r, a, "操作项必须是字符串");
			return;
		}
		if (!l.includes(e)) {
			u(r, a, `仅支持以下操作：${l.join(", ")}`);
			return;
		}
		if (i.has(e)) {
			u(r, a, `操作 ${e} 重复`);
			return;
		}
		i.add(e);
	});
}
function m(e, t, n, r) {
	e !== void 0 && d(e, t, n, r);
}
function h(e, t, n, r, i) {
	e !== void 0 && (t === "number" && typeof e != "number" && u(i, n, `${r} 必须是数字`), t === "boolean" && typeof e != "boolean" && u(i, n, `${r} 必须是布尔值`), t === "string" && typeof e != "string" && u(i, n, `${r} 必须是字符串`));
}
function g(e, t, n, r, i) {
	let a = e.type;
	switch (a) {
		case "string":
		case "number":
		case "boolean":
			h(t, a, n, r, i);
			return;
		case "image":
		case "video":
			m(t, n, r, i);
			return;
		case "array":
			C(t, n, r, i);
			return;
		default: return;
	}
}
function _(t) {
	return Array.isArray(t) ? "array" : t === null ? "null" : e(t) ? "object" : typeof t;
}
function v(e) {
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
function y(e, t, n, r, i) {
	let a = Object.keys(e), o = Object.keys(t), s = a.filter((e) => !o.includes(e)), c = o.filter((e) => !a.includes(e));
	s.length && u(i, n, `结构必须与 ${r} 一致，缺少字段：${s.join(", ")}`), c.length && u(i, n, `结构必须与 ${r} 一致，存在多余字段：${c.join(", ")}`), a.forEach((a) => {
		o.includes(a) && x(e[a], t[a], `${n}.${a}`, `${r}.${a}`, i);
	});
}
function b(t, n, r, i, a) {
	if (!t.length) return;
	let o = t[0];
	e(o) && n.forEach((t, n) => {
		e(t) && y(o, t, `${r}[${n}]`, `${i}[0]`, a);
	});
}
function x(t, n, r, i, a) {
	let o = _(t), s = _(n);
	if (o !== s) {
		u(a, r, `结构必须与 ${i} 一致，期望 ${v(o)}，实际 ${v(s)}`);
		return;
	}
	if (e(t) && e(n)) {
		y(t, n, r, i, a);
		return;
	}
	Array.isArray(t) && Array.isArray(n) && b(t, n, r, i, a);
}
function S(t, n, r) {
	let i = /* @__PURE__ */ new Set();
	t.forEach((t, a) => {
		if (!e(t) || typeof t.key != "string" || !t.key.trim()) return;
		let o = t.key.trim(), s = `${n}[${a}]`;
		if (i.has(o)) {
			u(r, `${s}.key`, `字段 key ${o} 重复`);
			return;
		}
		i.add(o);
	});
}
function C(t, n, r, i) {
	if (t === void 0) return;
	if (!Array.isArray(t)) {
		u(i, n, `${r} 必须是数组`);
		return;
	}
	S(t, n, i);
	let a = t.find((t) => e(t));
	t.forEach((t, r) => {
		T(t, `${n}[${r}]`, i), a && a !== t && e(t) && y(a, t, `${n}[${r}]`, `${n}[0]`, i);
	});
}
function w(e, t, n) {
	p(e.operations, `${t}.operations`, "字段 operations", n), C(e.value, `${t}.value`, "字段 value", n), C(e.defaultValue, `${t}.defaultValue`, "字段 defaultValue", n);
}
function T(t, n, r) {
	if (!e(t)) {
		u(r, n, "字段节点必须是对象");
		return;
	}
	let i = t.key, a = t.type;
	if ((typeof i != "string" || !i.trim()) && u(r, `${n}.key`, "字段 key 必须是非空字符串"), typeof a != "string" || !c.includes(a)) {
		u(r, `${n}.type`, `字段 type 必须是受支持的类型：${c.join(", ")}`);
		return;
	}
	switch (d(t.label, `${n}.label`, "字段 label", r), d(t.path, `${n}.path`, "字段 path", r), a) {
		case "string":
		case "number":
		case "boolean":
			g(t, t.value, `${n}.value`, "字段 value", r), h(t.defaultValue, a, `${n}.defaultValue`, "字段 defaultValue", r);
			break;
		case "image":
		case "video":
			g(t, t.value, `${n}.value`, "字段 value", r), m(t.defaultValue, `${n}.defaultValue`, "字段 defaultValue", r);
			break;
		case "array":
			w(t, n, r);
			break;
		default: break;
	}
}
function E(e, t, n) {
	if (!Array.isArray(e)) {
		u(n, t, "必须是字段数组");
		return;
	}
	S(e, t, n), e.forEach((e, r) => {
		T(e, `${t}[${r}]`, n);
	});
}
function D(t) {
	let r = [];
	if (!e(t)) u(r, "configJson", "必须是对象");
	else {
		f(t.meta, "configJson.meta", "meta", r), f(t.functions, "configJson.functions", "functions", r), t.dataSchema !== void 0 && !e(t.dataSchema) && u(r, "configJson.dataSchema", "dataSchema 必须是对象");
		let n = e(t.dataSchema) ? t.dataSchema.fields : void 0;
		n !== void 0 && E(n, "configJson.dataSchema.fields", r);
	}
	if (r.length) {
		let e = r.map((e) => `${e.path}: ${e.message}`).join("\n");
		throw Error(`template-sdk configJson 校验失败:\n${e}`);
	}
	return n(t);
}
//#endregion
//#region src/runtime/schema/artifacts.ts
function O(e) {
	return s(D(e));
}
function k(e) {
	let t = D(e);
	return {
		configJson: t,
		valueMap: s(t)
	};
}
function A(e, t = 2) {
	let n = k(e);
	return {
		configJson: JSON.stringify(n.configJson, null, t),
		valueMap: JSON.stringify(n.valueMap, null, t)
	};
}
//#endregion
export { D as i, A as n, O as r, k as t };
