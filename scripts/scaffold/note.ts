import { isName, notePath } from "../../src/lib/notes/names.ts";
import { placeholderSummary } from "../../src/lib/notes/template.ts";
import { typstString } from "../../src/lib/notes/typst.ts";

export interface NoteRequest {
	course: string;
	slug: string;
	title: string;
}

const libraryDirectory = "lib";

export interface NoteArguments {
	course?: string;
	slug?: string;
	title: string;
	startsCourse: boolean;
	unknownOption?: string;
}

export function parseNoteArguments(args: readonly string[]): NoteArguments {
	const words = args.filter((argument) => argument !== "--new-course");
	const names: string[] = [];
	let unknownOption: string | undefined;
	let index = 0;
	for (; index < words.length && names.length < 2; index++) {
		const word = words[index] ?? "";
		if (word.startsWith("--")) unknownOption ??= word;
		else names.push(word);
	}
	const [course, slug] = names;
	return {
		...(course !== undefined && { course }),
		...(slug !== undefined && { slug }),
		title: words.slice(index).join(" ").trim(),
		startsCourse: args.includes("--new-course"),
		...(unknownOption !== undefined && { unknownOption }),
	};
}

export function unknownCourseProblem(course: string, known: readonly string[]): string {
	const courses =
		known.length > 0 ? `the courses are ${known.join(", ")}` : "there are no courses yet";
	return `there is no course "${course}": ${courses}. To start one, see "Start a course" in docs/writing-notes.md, or pass --new-course to create notes/${course}/ now`;
}

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

export function nextOrder(sources: readonly string[]): number {
	const orders = sources.flatMap((source) => {
		const order = /#show:\s*note\.with\(.*?\border:\s*(-?\d+)/s.exec(source)?.[1];
		return order === undefined ? [] : [Number(order)];
	});
	return Math.max(0, ...orders) + 1;
}

export type NotePlacement = { outline: string } | { order: number };

export function noteSource(title: string, placement: NotePlacement): string {
	const placementLines =
		"order" in placement ? `order: ${placement.order},\n  draft: true,` : "draft: true,";
	return `#import "/lib/notes.typ": *
#show: note.with(
  title: ${typstString(title)},
  summary: ${typstString(placeholderSummary)},
  ${placementLines}
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

export function noteNextSteps(request: NoteRequest, placement: NotePlacement): string {
	const path = notePath(request);
	const address = `Read it with pnpm run dev at:\n  http://localhost:5173/${request.course}/${request.slug}`;
	if ("order" in placement) {
		return `Created ${path} as a draft with order ${placement.order}: pnpm run dev serves it, and the published site leaves it out.

${address}

The course has no outline, so its previous and next links follow order.
"Start a course" in docs/writing-notes.md says how to give it one.

To publish it, write its summary and remove draft: true from its header.`;
	}
	return `Created ${path} as a draft: pnpm run dev serves it, and the published site leaves it out.

${address}

To publish it:
  1. In ${placement.outline}, add this line to the section the note covers:
       note: "${request.slug}",
  2. Write the note's summary in its header.
  3. Remove draft: true from the header.`;
}
