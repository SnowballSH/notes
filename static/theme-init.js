(() => {
	const stored = () => {
		try {
			const theme = localStorage.getItem("fui-theme");
			return theme === "light" || theme === "dark" ? theme : undefined;
		} catch {
			return undefined;
		}
	};
	const system =
		typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
	const apply = () => {
		document.documentElement.dataset.theme = stored() ?? (system?.matches ? "dark" : "light");
	};
	apply();
	system?.addEventListener?.("change", () => {
		apply();
		dispatchEvent(new CustomEvent("fui-themechange"));
	});
})();
