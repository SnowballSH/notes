import { addClass, attribute, descendants, elementsNamed, type ParentNode } from "./dom";

// The colours of Typst's built-in syntax theme.
const tokenKinds: Readonly<Record<string, string>> = {
	"#d73948": "keyword",
	"#4b69c6": "function",
	"#16718d": "function",
	"#74747c": "comment",
	"#b60157": "constant",
	"#198810": "string",
	"#8b41b1": "keyword",
};

const inlineColour = /^color: (#[0-9a-f]{6})$/;

export function classifyCodeTokens(root: ParentNode): void {
	for (const code of elementsNamed(root, "code")) {
		for (const token of descendants(code).filter((element) => element.tagName === "span")) {
			const colour = inlineColour.exec(attribute(token, "style") ?? "")?.[1];
			const kind = colour === undefined ? undefined : tokenKinds[colour];
			if (kind === undefined) continue;
			token.attrs = token.attrs.filter((attr) => attr.name !== "style");
			addClass(token, `token-${kind}`);
		}
	}
}
