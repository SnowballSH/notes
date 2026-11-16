const storageKey = (course: string): string => `notes:last-read:${course}`;

/** Remembers, on this device, the note of a course the reader opened last. */
export function recordLastRead(course: string, href: string): void {
	try {
		localStorage.setItem(storageKey(course), href);
	} catch {}
}

export function lastRead(course: string): string | undefined {
	try {
		return localStorage.getItem(storageKey(course)) ?? undefined;
	} catch {
		return undefined;
	}
}
