import type { NoteRef } from "./types.ts";

const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isName = (text: string): boolean => namePattern.test(text);

export const noteHref = ({ course, slug }: NoteRef): string => `/${course}/${slug}`;

export const notePdfHref = (note: NoteRef): string => `${noteHref(note)}.pdf`;

export const notePath = ({ course, slug }: NoteRef): string => `notes/${course}/${slug}.typ`;
