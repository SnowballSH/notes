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

export function noteSource(title: string, order: number): string {
	return `#import "/lib/notes.typ": *
#show: note.with(
  title: ${typstString(title)},
  summary: "One sentence that says what this note covers, for search engines.",
  order: ${order},
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
