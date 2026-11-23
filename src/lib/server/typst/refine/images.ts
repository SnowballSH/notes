import {
	ancestors,
	attribute,
	childElements,
	type Element,
	elementsNamed,
	type ParentNode,
	setAttribute,
	textOf,
} from "./dom";

function captionOf(image: Element): string | undefined {
	const figure = ancestors(image).find((node) => node.tagName === "figure");
	const caption = figure && childElements(figure).find((child) => child.tagName === "figcaption");
	return caption ? textOf(caption).trim() : undefined;
}

export function describeImages(root: ParentNode): void {
	for (const image of elementsNamed(root, "img")) {
		if (attribute(image, "alt") === undefined) setAttribute(image, "alt", captionOf(image) ?? "");
	}
}
