/** Lowercase words joined by hyphens: the form of every course, note and widget name. */
export const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isName = (text: string): boolean => namePattern.test(text);
