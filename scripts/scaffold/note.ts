import { isName } from "../../src/lib/notes/names.ts";
import { typstString } from "../../src/lib/notes/typst.ts";

export interface NoteRequest {
	course: string;
	slug: string;
	title: string;
}

const libraryDirectory = "lib";

export function noteRequestProblem(
	course: string | undefined,
	slug: string | undefined,
	title: string,
): string | undefined {
	if (course === undefined || slug === undefined || title === "") {
		return "give a course, a slug and a title, such as: walsh-hadamard fast-transform The fast transform";
	}
	const invalid = [course, slug].find((name) => !isName(name));
	if (invalid !== undefined) {
		return `"${invalid}" is not a valid name: use lowercase words joined by hyphens`;
	}
	if (course === libraryDirectory)
		return `notes/${libraryDirectory} holds the Typst library, not a course`;
	return undefined;
}

/** One more than the highest `order:` among the sources of a course's notes, or 1 for a new course. */
export function nextOrder(sources: readonly string[]): number {
	const orders = sources.flatMap((source) => {
		const order = /#show:\s*note\.with\(.*?\border:\s*(-?\d+)/s.exec(source)?.[1];
		return order === undefined ? [] : [Number(order)];
	});
	return Math.max(0, ...orders) + 1;
}

export const notePath = ({ course, slug }: Pick<NoteRequest, "course" | "slug">): string =>
	`notes/${course}/${slug}.typ`;

/**
 * How a new note finds its place in its course: through the course's outline file, or by
 * its own `order` when the course has no outline.
 */
export type NotePlacement = { outline: string } | { order: number };

export function noteSource(title: string, placement: NotePlacement): string {
	const placementLine = "order" in placement ? `order: ${placement.order},` : "draft: true,";
	return `#import "/lib/notes.typ": *
#show: note.with(
  title: ${typstString(title)},
  summary: "One sentence that says what this note covers, for search engines.",
  ${placementLine}
)

Open with a sentence or two on what this note is about.

= First section

Text with inline math such as $x + 0 = x$, and display math on a line of its own:
$ e * x = x * e = x $

#definition(title: "Example")[
  State the definition here.
] <def-example>

Refer to it as @def-example.
`;
}

/** What the command prints after creating the note: where to read it and what is left to do. */
export function noteNextSteps(request: NoteRequest, placement: NotePlacement): string {
	const path = notePath(request);
	const address = `Read it with pnpm run dev at:\n  http://localhost:5173/${request.course}/${request.slug}`;
	if ("order" in placement) {
		return `Created ${path} with order ${placement.order}.

${address}

The course has no outline, so its previous and next links follow order.
"Start a course" in docs/writing-notes.md says how to give it one.`;
	}
	return `Created ${path} as a draft: pnpm run dev serves it, and the published site leaves it out.

${address}

To publish it:
  1. In ${placement.outline}, add this line to the section the note covers:
       note: "${request.slug}",
  2. Remove draft: true from the note's header.`;
}
