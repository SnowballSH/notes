import {
	attribute,
	type Element,
	elementsNamed,
	type ParentNode,
	setAttribute,
	textOf,
} from "./dom";

function captionOf(image: Element): string | undefined {
	const figure = image.parentNode;
	if (!figure || !("tagName" in figure) || figure.tagName !== "figure") return undefined;
	const caption = figure.childNodes.find(
		(child): child is Element => "tagName" in child && child.tagName === "figcaption",
	);
	return caption ? textOf(caption).trim() : undefined;
}

/**
 * An image the author gave no description is announced by its address, which for an
 * embedded image is a long run of data. It takes its figure's caption as its text, or
 * none, which tells a screen reader to pass over it.
 */
export function describeImages(root: ParentNode): void {
	for (const image of elementsNamed(root, "img")) {
		if (attribute(image, "alt") === undefined) setAttribute(image, "alt", captionOf(image) ?? "");
	}
}
