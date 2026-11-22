/** Lowercase words joined by hyphens: the form of every course, note and widget name. */
export const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isName = (text: string): boolean => namePattern.test(text);

export const noteHref = ({ course, slug }: { course: string; slug: string }): string =>
	`/${course}/${slug}`;

/** A note's PDF edition is served at the note's address with `.pdf` added. */
export const notePdfHref = (note: { course: string; slug: string }): string =>
	`${noteHref(note)}.pdf`;
